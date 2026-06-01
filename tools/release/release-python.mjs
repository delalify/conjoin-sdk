import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { findLastTag, listScopedCommits, prependChangelog, renderChangelog, tagExists } from './lib/git-history.mjs'
import { createRelease } from './lib/github-release.mjs'
import { readManifestVersion, writeManifestVersion } from './lib/pyproject-version.mjs'
import { repoUrl, resolveRepoSlug } from './lib/repo.mjs'
import { run, tryRun } from './lib/run.mjs'
import { resolveVersion } from './lib/version.mjs'

const PROJECT_ROOT = 'sdks/python'
const SCOPE_PATHS = ['sdks/python']
const TAG_PREFIX = 'sdk-python@v'
const MANIFEST = resolve(PROJECT_ROOT, 'pyproject.toml')
const CHANGELOG = resolve(PROJECT_ROOT, 'CHANGELOG.md')

function parseArgs(argv) {
  const options = { version: process.env.VERSION ?? '', dryRun: false, firstRelease: false }

  for (const arg of argv) {
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

function tagPointsAtHead(tag) {
  const tagRef = tryRun('git', ['rev-list', '-n', '1', tag])
  const head = tryRun('git', ['rev-parse', 'HEAD'])
  return tagRef.ok && head.ok && tagRef.stdout === head.stdout
}

function stageReleaseFiles() {
  run('git', ['add', '--', MANIFEST, CHANGELOG])
  const staged = tryRun('git', ['diff', '--cached', '--quiet'])
  return staged.status === 1
}

async function main() {
  const { version: rawVersion, dryRun, firstRelease } = parseArgs(process.argv.slice(2))

  const currentVersion = readManifestVersion(MANIFEST)
  const version = resolveVersion(rawVersion, currentVersion)
  const tag = `${TAG_PREFIX}${version}`

  if (tagExists(tag) && !tagPointsAtHead(tag)) {
    throw new Error(`Tag ${tag} already exists and does not point at HEAD; refusing to clobber`)
  }

  const slug = resolveRepoSlug()
  const fromTag = firstRelease ? null : findLastTag(`${TAG_PREFIX}*`)
  const commits = listScopedCommits({ fromTag, paths: SCOPE_PATHS })
  const date = new Date().toISOString().slice(0, 10)
  const entry = renderChangelog({ version, date, commits, repoUrl: repoUrl(slug) })

  const existing = existsSync(CHANGELOG) ? readFileSync(CHANGELOG, 'utf-8') : ''
  const nextChangelog = prependChangelog(existing, entry)

  if (dryRun) {
    process.stdout.write(`[dry-run] sdk-python release ${version} (range: ${fromTag ?? 'HEAD'})\n`)
    process.stdout.write(`[dry-run] ${commits.length} commit(s) in scope ${SCOPE_PATHS.join(', ')}\n`)
    process.stdout.write(`${entry}\n`)
    return
  }

  writeManifestVersion(MANIFEST, version)
  writeFileSync(CHANGELOG, nextChangelog)

  const hasStagedChanges = stageReleaseFiles()

  if (hasStagedChanges) {
    run('git', ['commit', '-m', `chore(release): ${version}`])
  }

  if (!tagExists(tag)) {
    run('git', ['tag', '-a', tag, '-m', `sdk-python ${version}`])
  }

  run('git', ['push', 'origin', 'HEAD'])
  run('git', ['push', 'origin', tag])

  const result = createRelease({
    tag,
    title: `Python SDK ${version}`,
    notes: entry,
    repo: slug,
  })

  process.stdout.write(
    result.created
      ? `Created GitHub release for ${tag}\n`
      : `GitHub release for ${tag} already existed; left unchanged\n`,
  )
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
