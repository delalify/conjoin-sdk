import { tryRun } from './run.mjs'

const SLUG_PATTERN = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/

function parseSlug(value) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value
    .trim()
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')

  const sshMatch = /^git@github\.com:(.+)$/.exec(trimmed)

  if (sshMatch) {
    return SLUG_PATTERN.test(sshMatch[1]) ? sshMatch[1] : null
  }

  const httpsMatch = /^https?:\/\/github\.com\/(.+)$/.exec(trimmed)

  if (httpsMatch) {
    return SLUG_PATTERN.test(httpsMatch[1]) ? httpsMatch[1] : null
  }

  return SLUG_PATTERN.test(trimmed) ? trimmed : null
}

/**
 * Resolves the GitHub "owner/name" slug, preferring the value GitHub Actions
 * injects and falling back to the configured git remote. The result is matched
 * against a strict slug shape so it can be embedded in a release URL without
 * any further escaping.
 */
export function resolveRepoSlug() {
  const fromEnv = parseSlug(process.env.GITHUB_REPOSITORY)

  if (fromEnv) {
    return fromEnv
  }

  const remote = tryRun('git', ['remote', 'get-url', 'origin'])

  if (remote.ok) {
    const fromRemote = parseSlug(remote.stdout)

    if (fromRemote) {
      return fromRemote
    }
  }

  throw new Error('Unable to resolve the GitHub repository slug from GITHUB_REPOSITORY or the origin remote')
}

export function repoUrl(slug) {
  return `https://github.com/${slug}`
}
