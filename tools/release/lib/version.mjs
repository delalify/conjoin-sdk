const BUMP_KEYWORDS = new Set(['patch', 'minor', 'major'])

const SEMVER_CORE = /^(\d+)\.(\d+)\.(\d+)$/
const SEMVER_FULL = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/

export class VersionError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'VersionError'
    this.code = code
  }
}

export function parseCoreVersion(value) {
  const match = SEMVER_CORE.exec(value)

  if (!match) {
    throw new VersionError(
      `Current version "${value}" is not a plain MAJOR.MINOR.PATCH version; bump keywords cannot be applied`,
      'INVALID_CURRENT_VERSION',
    )
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
  }
}

/**
 * Validates the untrusted version input and resolves it to a concrete version
 * string. Bump keywords are applied to the current manifest version; explicit
 * versions are accepted only when they match a strict semver shape, so no shell
 * metacharacter or path fragment can survive into a tag name or git argument.
 */
export function resolveVersion(input, currentVersion) {
  if (typeof input !== 'string' || input.length === 0) {
    throw new VersionError('Version input is required', 'MISSING_VERSION')
  }

  if (input.length > 64) {
    throw new VersionError('Version input is too long', 'INVALID_VERSION')
  }

  if (BUMP_KEYWORDS.has(input)) {
    const { major, minor, patch } = parseCoreVersion(currentVersion)

    if (input === 'major') {
      return `${major + 1}.0.0`
    }

    if (input === 'minor') {
      return `${major}.${minor + 1}.0`
    }

    return `${major}.${minor}.${patch + 1}`
  }

  if (!SEMVER_FULL.test(input)) {
    throw new VersionError(
      `Invalid version input "${input}"; expected patch, minor, major, or a semver like 1.2.3`,
      'INVALID_VERSION',
    )
  }

  return input
}
