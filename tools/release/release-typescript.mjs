import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  findLastTag,
  listScopedCommits,
  prependChangelog,
  readTopEntry,
  renderChangelog,
  tagExists,
} from './lib/git-history.mjs'
import { assertCleanExcept } from './lib/git-tree.mjs'
import { createRelease } from './lib/github-release.mjs'
import { repoUrl, resolveRepoSlug } from './lib/repo.mjs'
import { run } from './lib/run.mjs'
import { resolveVersion } from './lib/version.mjs'

const PACKAGE_DIRS = ['sdks/typescript', 'sdks/typescript-react-core', 'sdks/typescript-react', 'sdks/typescript-expo']
const SCOPE_PATHS = [...PACKAGE_DIRS]
const PRIMARY_MANIFEST = resolve(PACKAGE_DIRS[0], 'package.json')
const PRIMARY_CHANGELOG = resolve(PACKAGE_DIRS[0], 'CHANGELOG.md')
const TAG_PREFIX = 'typescript-v'

function parseArgs(argv) {
  const options = {
    command: argv[0],
    version: process.env.VERSION ?? '',
    dryRun: false,
    firstRelease: false,
  }

  for (const arg of argv.slice(1)) {
    if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--first-release') {
      options.firstRelease = true
    } else if (arg.startsWith('--version=')) {
      options.version = arg.slice('--version='.length)
    }
  }

  if (process.env.DRY_RUN === 'true') {
    options.dryRun = true
  }

  if (process.env.FIRST_RELEASE === 'true') {
    options.firstRelease = true
  }

  return options
}

function readManifestVersion(manifestPath) {
  const parsed = JSON.parse(readFileSync(manifestPath, 'utf-8'))

  if (typeof parsed.version !== 'string') {
    throw new Error(`No string version field in ${manifestPath}`)
  }

  return parsed.version
}

function buildEntry({ version, firstRelease }) {
  const slug = resolveRepoSlug()
  const fromTag = firstRelease ? null : findLastTag(`${TAG_PREFIX}*`, TAG_PREFIX)
  const commits = listScopedCommits({ fromTag, paths: SCOPE_PATHS })
  const date = new Date().toISOString().slice(0, 10)
  const entry = renderChangelog({ version, date, commits, repoUrl: repoUrl(slug) })
  return { slug, fromTag, commits, entry }
}

function writeNotes({ version, dryRun, firstRelease }) {
  const { fromTag, commits, entry } = buildEntry({ version, firstRelease })
  const targets = PACKAGE_DIRS.map(dir => resolve(dir, 'CHANGELOG.md'))

  if (dryRun) {
    process.stdout.write(`[dry-run] typescript release ${version} (range: ${fromTag ?? 'HEAD'})\n`)
    process.stdout.write(`[dry-run] ${commits.length} commit(s) in scope ${SCOPE_PATHS.join(', ')}\n`)
    process.stdout.write(`${entry}\n`)
    return
  }

  for (const target of targets) {
    const existing = existsSync(target) ? readFileSync(target, 'utf-8') : ''
    writeFileSync(target, prependChangelog(existing, entry))
  }

  run('git', ['add', '--', ...targets])

  // nx commits the entire index in the following version/tag step, so the tree
  // must hold nothing beyond these changelog edits before that commit is built.
  // Codegen or format drift present here would otherwise be folded into the
  // release commit, tag, and npm tarball.
  assertCleanExcept(targets)

  process.stdout.write(`Wrote and staged ${targets.length} CHANGELOG.md files for ${version}\n`)
}

function resolveReleaseNotes({ version, firstRelease }) {
  if (existsSync(PRIMARY_CHANGELOG)) {
    const topEntry = readTopEntry(readFileSync(PRIMARY_CHANGELOG, 'utf-8'))

    if (topEntry) {
      return topEntry
    }
  }

  return buildEntry({ version, firstRelease }).entry
}

function publishRelease({ version, dryRun, firstRelease }) {
  const tag = `${TAG_PREFIX}${version}`

  if (dryRun) {
    process.stdout.write(`[dry-run] would create GitHub release for ${tag}\n`)
    return
  }

  // nx (git.push: true) is the sole owner of pushing the release commit and tag
  // for the TypeScript track, so this step only verifies the tag is present and
  // creates the GitHub release. Pushing again here would duplicate that work and
  // muddy crash-recovery reasoning across the two tracks.
  if (!tagExists(tag)) {
    throw new Error(`Tag ${tag} does not exist; run the nx release step before creating the GitHub release`)
  }

  const entry = resolveReleaseNotes({ version, firstRelease })
  const slug = resolveRepoSlug()
  const result = createRelease({
    tag,
    title: `TypeScript SDK ${version}`,
    notes: entry,
    repo: slug,
  })

  process.stdout.write(
    result.created
      ? `Created GitHub release for ${tag}\n`
      : `GitHub release for ${tag} already existed; left unchanged\n`,
  )
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const currentVersion = readManifestVersion(PRIMARY_MANIFEST)

  if (options.command === 'notes') {
    const version = resolveVersion(options.version, currentVersion)
    writeNotes({ version, dryRun: options.dryRun, firstRelease: options.firstRelease })
    return
  }

  if (options.command === 'release') {
    const version = resolveVersion(currentVersion, currentVersion)
    publishRelease({ version, dryRun: options.dryRun, firstRelease: options.firstRelease })
    return
  }

  throw new Error(`Unknown command "${options.command ?? ''}"; expected "notes" or "release"`)
}

try {
  main()
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
