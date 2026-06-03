import { run, tryRun } from './run.mjs'

// git forbids the NUL byte inside a commit message, so NUL is the one separator
// a hostile subject can never contain. git emits a literal NUL for the %x00
// placeholder, so the format string passed through argv stays plain ASCII
// (spawn rejects a NUL inside an argument) while the output is NUL-framed.
// The log stream is then a flat list of (hash, shortHash, subject) triples
// that no control character embedded in a subject can re-frame.
const GIT_FORMAT_SEPARATOR = '%x00'
const OUTPUT_SEPARATOR = '\u0000'
const FIELDS_PER_RECORD = 3

const CONVENTIONAL_HEADER = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/

const RELEASE_COMMIT = /^chore\(release\):/

// Control characters in a subject can mangle the rendered markdown or smuggle
// terminal escapes through the changelog; strip the C0 range, DEL, and the C1
// range before the subject is parsed or rendered.
// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping the control range is the intent of this regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g

const MAX_SUBJECT_LENGTH = 200

const MARKDOWN_METACHARACTERS = /[\\`*_{}[\]()#+.!<>|~]/g

const TAG_REFERENCE = /^[\w./-]+$/

const SECTIONS = [
  { key: 'feat', title: 'Features' },
  { key: 'fix', title: 'Fixes' },
  { key: 'perf', title: 'Performance' },
  { key: 'refactor', title: 'Refactors' },
  { key: 'docs', title: 'Documentation' },
  { key: 'other', title: 'Other Changes' },
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
 * resolve to an attacker-supplied ref, and its shape is validated against the
 * expected prefix and a semver core so a malformed tag matching the glob cannot
 * skew the notes range.
 */
export function findLastTag(pattern, expectedPrefix) {
  const listed = tryRun('git', ['tag', '--list', pattern, '--sort=-v:refname'])

  if (!listed.ok || listed.stdout.length === 0) {
    return null
  }

  const [first] = listed.stdout.split('\n').filter(line => line.length > 0)

  if (first === undefined) {
    return null
  }

  if (!isValidTag(first, expectedPrefix)) {
    throw new Error(`Resolved last tag "${first}" does not match the expected "${expectedPrefix}<semver>" shape`)
  }

  return first
}

function isValidTag(tag, expectedPrefix) {
  if (!TAG_REFERENCE.test(tag)) {
    return false
  }

  if (typeof expectedPrefix === 'string' && expectedPrefix.length > 0) {
    if (!tag.startsWith(expectedPrefix)) {
      return false
    }

    const remainder = tag.slice(expectedPrefix.length)
    return /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(remainder)
  }

  return true
}

function parseRecord(record) {
  const fields = record.split(OUTPUT_SEPARATOR)

  if (fields.length < FIELDS_PER_RECORD) {
    return null
  }

  const hash = fields[0].trim()
  const shortHash = fields[1].trim()
  const subject = sanitizeSubject(fields[2])

  if (hash.length === 0 || shortHash.length === 0 || subject.length === 0) {
    return null
  }

  return { hash, shortHash, subject }
}

function sanitizeSubject(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.replace(CONTROL_CHARACTERS, '').trim().slice(0, MAX_SUBJECT_LENGTH)
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
  const format = ['%H', '%h', '%s'].join(GIT_FORMAT_SEPARATOR)
  const stdout = run('git', ['log', range, `--format=${format}`, '--no-merges', '--', ...paths])

  return stdout
    .split('\n')
    .map(parseRecord)
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

/**
 * Neutralizes a commit-derived string for inclusion in markdown release notes.
 * Control characters are stripped first so the renderer is safe even when a
 * caller passes an unsanitized subject, then markdown and HTML metacharacters
 * are backslash-escaped so a subject or scope cannot inject formatting, links,
 * or raw HTML into the notes or the CHANGELOG shipped to npm. The text stays
 * human-readable; only the structural characters change.
 */
function escapeMarkdown(value) {
  return value.replace(CONTROL_CHARACTERS, '').replace(MARKDOWN_METACHARACTERS, match => `\\${match}`)
}

function renderEntry(commit, repoUrl) {
  const { scope, description } = classify(commit.subject)
  const prefix = scope ? `**${escapeMarkdown(scope)}:** ` : ''
  const link = `([${commit.shortHash}](${repoUrl}/commit/${commit.hash}))`
  return `- ${prefix}${escapeMarkdown(description)} ${link}`
}

/**
 * Renders markdown release notes grouped by conventional-commit type. The
 * output shape matches across both release tracks so Python and TypeScript
 * notes read identically. Section headers are plain text so no emoji reaches
 * the generated notes.
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
