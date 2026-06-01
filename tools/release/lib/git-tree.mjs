import { relative, resolve } from 'node:path'
import { run } from './run.mjs'

export class DirtyTreeError extends Error {
  constructor(message, paths) {
    super(message)
    this.name = 'DirtyTreeError'
    this.code = 'DIRTY_TREE'
    this.paths = paths
  }
}

function normalize(path) {
  return relative(process.cwd(), resolve(path)).split('\\').join('/')
}

/**
 * Parses `git status --porcelain=v1 -z` into the set of changed paths. The NUL
 * framing keeps paths with spaces or newlines intact, and a rename record
 * (which encodes both the new and the original path) contributes both paths so
 * a rename out of the allowed set is still caught.
 */
function changedPaths(porcelain) {
  const entries = porcelain.split('\u0000').filter(entry => entry.length > 0)
  const paths = []

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    const status = entry.slice(0, 2)
    const value = entry.slice(3)

    if (value.length === 0) {
      continue
    }

    paths.push(value)

    // A rename or copy record places the original path in the next NUL field.
    if (status[0] === 'R' || status[0] === 'C') {
      const original = entries[index + 1]

      if (original !== undefined) {
        paths.push(original)
        index += 1
      }
    }
  }

  return paths
}

/**
 * Fails loudly when the working tree or index contains any change outside the
 * allowed paths. The release commit must carry only the intended version bumps
 * and changelog edits, so any codegen, format, or other drift present before
 * the version and tag step is surfaced here rather than silently folded into
 * the release commit, tag, and published tarball.
 */
export function assertCleanExcept(allowedPaths) {
  const allowed = new Set(allowedPaths.map(normalize))
  const porcelain = run('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all'])
  const offending = changedPaths(porcelain)
    .map(normalize)
    .filter(path => !allowed.has(path))

  if (offending.length > 0) {
    const unique = [...new Set(offending)].sort()
    throw new DirtyTreeError(
      `Working tree has unexpected changes outside the release set:\n${unique.map(path => `  ${path}`).join('\n')}`,
      unique,
    )
  }
}
