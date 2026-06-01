import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run, tryRun } from './run.mjs'

export class GithubReleaseError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'GithubReleaseError'
    this.code = code
  }
}

export function releaseExists(tag) {
  return tryRun('gh', ['release', 'view', tag, '--json', 'tagName']).ok
}

/**
 * Creates a GitHub release attached to an already-created tag. The notes are
 * passed through a temp file so commit subjects are never interpolated into a
 * shell, and the call is idempotent: a release already present for the tag is
 * left untouched so a re-run after a partial failure does not error.
 */
export function createRelease({ tag, title, notes, repo }) {
  if (!tag) {
    throw new GithubReleaseError('A tag is required to create a release', 'MISSING_TAG')
  }

  if (releaseExists(tag)) {
    return { created: false, tag }
  }

  const dir = mkdtempSync(join(tmpdir(), 'conjoin-release-'))
  const notesPath = join(dir, 'notes.md')

  try {
    writeFileSync(notesPath, notes ?? '')

    const args = ['release', 'create', tag, '--title', title, '--notes-file', notesPath, '--verify-tag']

    if (repo) {
      args.push('--repo', repo)
    }

    run('gh', args)
    return { created: true, tag }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
