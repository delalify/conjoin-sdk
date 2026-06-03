import { readFileSync, writeFileSync } from 'node:fs'

export class PyprojectVersionError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'PyprojectVersionError'
    this.code = code
  }
}

function splitLines(contents) {
  return contents.match(/[^\n]*(?:\n|$)/g)?.filter(line => line.length > 0) ?? []
}

function findProjectVersionLine(contents, manifestPath) {
  const lines = splitLines(contents)
  const projectTableStart = lines.findIndex(line => /^\s*\[\s*project\s*]\s*(?:#.*)?$/.test(line))

  if (projectTableStart === -1) {
    throw new PyprojectVersionError(`Unable to find [project] table in ${manifestPath}`, 'NO_PROJECT_TABLE')
  }

  const nextTableStart = lines.findIndex((line, index) => index > projectTableStart && /^\s*\[/.test(line))
  const projectTableEnd = nextTableStart === -1 ? lines.length : nextTableStart

  let versionLineIndex = -1
  let version = null

  for (let index = projectTableStart + 1; index < projectTableEnd; index += 1) {
    const versionMatch = /^(\s*)version\s*=\s*(["'])([^"'\r\n]+)\2\s*(?:#.*)?(?:\r?\n)?$/.exec(lines[index])

    if (!versionMatch) {
      continue
    }

    if (versionLineIndex !== -1) {
      throw new PyprojectVersionError(
        `Found multiple [project].version entries in ${manifestPath}`,
        'DUPLICATE_VERSION',
      )
    }

    versionLineIndex = index
    version = versionMatch[3]
  }

  if (versionLineIndex === -1 || version === null) {
    throw new PyprojectVersionError(`Unable to find [project].version in ${manifestPath}`, 'NO_VERSION')
  }

  return { lines, lineIndex: versionLineIndex, version }
}

export function readProjectVersion(contents, manifestPath) {
  return findProjectVersionLine(contents, manifestPath).version
}

export function writeProjectVersion(contents, newVersion, manifestPath) {
  const match = findProjectVersionLine(contents, manifestPath)
  const versionLine = match.lines[match.lineIndex]
  const updatedLine = versionLine.replace(
    /^(\s*version\s*=\s*)(["'])([^"'\r\n]+)(\2)(\s*(?:#.*)?(?:\r?\n)?$)/,
    `$1$2${newVersion}$4$5`,
  )

  const updatedLines = [...match.lines]
  updatedLines[match.lineIndex] = updatedLine

  return updatedLines.join('')
}

export function readManifestVersion(manifestPath) {
  const contents = readFileSync(manifestPath, 'utf-8')
  return readProjectVersion(contents, manifestPath)
}

export function writeManifestVersion(manifestPath, newVersion) {
  const contents = readFileSync(manifestPath, 'utf-8')
  const updated = writeProjectVersion(contents, newVersion, manifestPath)

  if (updated === contents) {
    return false
  }

  writeFileSync(manifestPath, updated)
  return true
}
