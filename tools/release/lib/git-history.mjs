import { run, tryRun } from './run.mjs'

const RECORD_SEPARATOR = '\u001e'
const FIELD_SEPARATOR = '\u001f'

const CONVENTIONAL_HEADER = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/

const RELEASE_COMMIT = /^chore\(release\):/

const SECTIONS = [
  { key: 'feat', title: '🚀 Features' },
  { key: 'fix', title: '🩹 Fixes' },
  { key: 'perf', title: '⚡ Performance' },
  { key: 'refactor', title: '🔨 Refactors' },
  { key: 'docs', title: '📖 Documentation' },
  { key: 'other', title: '🧱 Other Changes' },
]

const TYPE_TO_SECTION = new Map([
  ['feat', 'feat'],
  ['fix', 'fix'],
  ['perf', 'perf'],
  ['refactor', 'refactor'],
  ['docs', 'docs'],
])

export function tagExists(tag) {
  return tryRun('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`]).ok
}

/**
 * Finds the most recent existing tag matching the glob, ordered by version so
 * the newest release is chosen even when tags were not created in order. The
 * resolved tag is intersected with the actual tag list so a pattern can never
 * resolve to an attacker-supplied ref.
 */
export function findLastTag(pattern) {
  const listed = tryRun('git', ['tag', '--list', pattern, '--sort=-v:refname'])

  if (!listed.ok || listed.stdout.length === 0) {
    return null
  }

  const [first] = listed.stdout.split('\n').filter(line => line.length > 0)
  return first ?? null
}

function parseCommitRecord(record) {
  const [hash, shortHash, subject] = record.split(FIELD_SEPARATOR)

  if (!hash || !shortHash || subject === undefined) {
    return null
  }

  return { hash, shortHash, subject }
}

/**
 * Lists commits in (fromTag, HEAD] that touched any of the given paths. When
 * fromTag is null (first release) the full history reachable from HEAD is used,
 * still scoped to the paths so a combined-tree first release stays per-track.
 */
export function listScopedCommits({ fromTag, paths }) {
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error('listScopedCommits requires at least one path')
  }

  const range = fromTag ? `${fromTag}..HEAD` : 'HEAD'
  const format = ['%H', '%h', '%s'].join(FIELD_SEPARATOR) + RECORD_SEPARATOR
  const stdout = run('git', ['log', range, `--format=${format}`, '--no-merges', '--', ...paths])

  return stdout
    .split(RECORD_SEPARATOR)
    .map(entry => entry.replace(/^\n/, ''))
    .filter(entry => entry.trim().length > 0)
    .map(parseCommitRecord)
    .filter(commit => commit !== null && !RELEASE_COMMIT.test(commit.subject))
}

function classify(subject) {
  const match = CONVENTIONAL_HEADER.exec(subject)

  if (!match) {
    return { section: 'other', scope: null, description: subject }
  }

  const [, type, scope, , description] = match
  const section = TYPE_TO_SECTION.get(type.toLowerCase()) ?? 'other'
  return { section, scope: scope ?? null, description }
}

function renderEntry(commit, repoUrl) {
  const { scope, description } = classify(commit.subject)
  const prefix = scope ? `**${scope}:** ` : ''
  const link = `([${commit.shortHash}](${repoUrl}/commit/${commit.hash}))`
  return `- ${prefix}${description} ${link}`
}

/**
 * Renders markdown release notes grouped by conventional-commit type. The
 * output shape matches across both release tracks so Python and TypeScript
 * notes read identically.
 */
export function renderChangelog({ version, date, commits, repoUrl }) {
  const buckets = new Map(SECTIONS.map(section => [section.key, []]))

  for (const commit of commits) {
    const { section } = classify(commit.subject)
    buckets.get(section)?.push(commit)
  }

  const lines = [`## ${version} (${date})`]

  if (commits.length === 0) {
    lines.push('', 'No user-facing changes were recorded for this release.')
    return `${lines.join('\n')}\n`
  }

  for (const section of SECTIONS) {
    const entries = buckets.get(section.key) ?? []

    if (entries.length === 0) {
      continue
    }

    lines.push('', `### ${section.title}`, '')

    for (const commit of entries) {
      lines.push(renderEntry(commit, repoUrl))
    }
  }

  return `${lines.join('\n')}\n`
}

export function prependChangelog(existingContents, entry) {
  const trimmedExisting = existingContents.trimStart()

  if (trimmedExisting.length === 0) {
    return entry
  }

  return `${entry}\n${trimmedExisting}`
}

/**
 * Extracts the most recent version block from an existing changelog so the
 * GitHub release reuses the exact bytes already committed for the tag, rather
 * than regenerating notes over a range that now contains the release commit.
 */
export function readTopEntry(contents) {
  const start = contents.indexOf('## ')

  if (start === -1) {
    return null
  }

  const next = contents.indexOf('\n## ', start + 1)
  const block = next === -1 ? contents.slice(start) : contents.slice(start, next + 1)
  return block.trimEnd()
}
