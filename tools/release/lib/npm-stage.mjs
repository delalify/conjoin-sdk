import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { run, tryRun } from './run.mjs'

const MINIMUM_STAGING_NPM_VERSION = [11, 15, 0]
const MINIMUM_STAGING_NODE_VERSION = [22, 14, 0]
const STABLE_DIST_TAG = 'latest'
const PRERELEASE_DIST_TAG = 'next'
const REGISTRY_NOT_FOUND_CODE = 'E404'

export class StagePublishError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'StagePublishError'
    this.code = code
  }
}

function parseVersionTriple(value) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(value).trim())

  if (!match) {
    return null
  }

  return match.slice(1, 4).map(part => Number.parseInt(part, 10))
}

function isAtLeast(actual, minimum) {
  for (let index = 0; index < minimum.length; index += 1) {
    if (actual[index] !== minimum[index]) {
      return actual[index] > minimum[index]
    }
  }

  return true
}

export function assertStagingToolchain() {
  const npmVersion = run('npm', ['--version']).trim()
  const npmTriple = parseVersionTriple(npmVersion)

  if (!npmTriple || !isAtLeast(npmTriple, MINIMUM_STAGING_NPM_VERSION)) {
    throw new StagePublishError(
      `npm ${npmVersion} cannot stage packages; staged publishing needs npm ${MINIMUM_STAGING_NPM_VERSION.join('.')} or later`,
      'NPM_TOO_OLD',
    )
  }

  const nodeVersion = process.versions.node
  const nodeTriple = parseVersionTriple(nodeVersion)

  if (!nodeTriple || !isAtLeast(nodeTriple, MINIMUM_STAGING_NODE_VERSION)) {
    throw new StagePublishError(
      `Node ${nodeVersion} cannot stage packages; staged publishing needs Node ${MINIMUM_STAGING_NODE_VERSION.join('.')} or later`,
      'NODE_TOO_OLD',
    )
  }

  return { npmVersion, nodeVersion }
}

export function distTagFor(version) {
  return version.includes('-') ? PRERELEASE_DIST_TAG : STABLE_DIST_TAG
}

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function registryLookup(spec) {
  const result = tryRun('npm', ['view', spec, 'version', '--json'])

  if (result.ok) {
    return { found: result.stdout.length > 0 }
  }

  const parsed = parseJson(result.stdout)

  if (parsed?.error?.code === REGISTRY_NOT_FOUND_CODE) {
    return { found: false }
  }

  throw new StagePublishError(
    `Could not look up ${spec} on the npm registry:\n${result.stderr || result.stdout || 'no output'}`,
    'REGISTRY_LOOKUP_FAILED',
  )
}

function packageExists(name) {
  try {
    return registryLookup(name).found
  } catch {
    return true
  }
}

function readManifest(packageDir) {
  const manifestPath = resolve(packageDir, 'package.json')
  const parsed = JSON.parse(readFileSync(manifestPath, 'utf-8'))

  if (typeof parsed.name !== 'string' || typeof parsed.version !== 'string') {
    throw new StagePublishError(`${manifestPath} needs a string name and version`, 'INVALID_MANIFEST')
  }

  return { name: parsed.name, version: parsed.version }
}

function packPackage({ packageDir, destination, name, version }) {
  const output = run('pnpm', ['pack', '--pack-destination', destination, '--json'], { cwd: resolve(packageDir) })
  const packed = parseJson(output)

  if (!packed || typeof packed.filename !== 'string') {
    throw new StagePublishError(`pnpm pack printed no tarball for ${name}:\n${output}`, 'PACK_FAILED')
  }

  if (packed.name !== name || packed.version !== version) {
    throw new StagePublishError(
      `pnpm pack produced ${packed.name}@${packed.version}, expected ${name}@${version}`,
      'PACK_MISMATCH',
    )
  }

  return join(destination, basename(packed.filename))
}

function stageTarball({ tarball, name, tag, dryRun }) {
  const args = ['stage', 'publish', tarball, '--provenance', '--access', 'public', '--tag', tag, '--json']

  if (dryRun) {
    args.push('--dry-run')
  }

  const result = tryRun('npm', args)

  if (!result.ok) {
    return { ok: false, detail: [result.stderr, result.stdout].filter(Boolean).join('\n') || 'no output' }
  }

  const stageId = parseJson(result.stdout)?.[name]?.stageId

  return { ok: true, stageId: typeof stageId === 'string' ? stageId : null }
}

function describeStagingFailure({ name, version, detail }) {
  const hints = [
    `Staging ${name}@${version} failed.`,
    `npm's trusted publisher for ${name} must allow staged publishing from this repository's publish-typescript.yml workflow.`,
    `If ${name}@${version} is already staged, approve or reject it in the package's Staged Packages tab on npmjs.com.`,
  ]

  if (!packageExists(name)) {
    hints.push(
      `${name} is not on npm yet, so a maintainer has to create it and add a trusted publisher that allows staged publishing from this workflow.`,
    )
  }

  return `${hints.join('\n')}\n${detail}`
}

export function stagePackages({ packageDirs, version, dryRun }) {
  const toolchain = assertStagingToolchain()
  const tag = distTagFor(version)
  const destination = mkdtempSync(join(tmpdir(), 'conjoin-stage-'))
  const staged = []
  const skipped = []
  const failures = []

  try {
    for (const packageDir of packageDirs) {
      const { name, version: manifestVersion } = readManifest(packageDir)

      if (manifestVersion !== version) {
        failures.push({ name, message: `${name} is at ${manifestVersion}, expected ${version}` })
        continue
      }

      try {
        if (registryLookup(`${name}@${version}`).found) {
          skipped.push({ name, version })
          continue
        }

        const tarball = packPackage({ packageDir, destination, name, version })
        const result = stageTarball({ tarball, name, tag, dryRun })

        if (result.ok) {
          staged.push({ name, version, stageId: result.stageId })
        } else {
          failures.push({ name, message: describeStagingFailure({ name, version, detail: result.detail }) })
        }
      } catch (error) {
        failures.push({ name, message: error instanceof Error ? error.message : String(error) })
      }
    }
  } finally {
    rmSync(destination, { recursive: true, force: true })
  }

  return { toolchain, tag, staged, skipped, failures }
}
