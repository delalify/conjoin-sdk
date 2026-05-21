const { join } = require("node:path");
const { VersionActions } = require("nx/release");

class PythonVersionActions extends VersionActions {
  validManifestFilenames = ["pyproject.toml"];

  async readCurrentVersionFromSourceManifest(tree) {
    const manifestPath = this.getManifestPath();
    const contents = readTextFile(tree, manifestPath);

    return {
      currentVersion: readProjectVersion(contents, manifestPath),
      manifestPath,
    };
  }

  async readCurrentVersionFromRegistry() {
    return null;
  }

  async readCurrentVersionOfDependency() {
    return {
      currentVersion: null,
      dependencyCollection: null,
    };
  }

  async updateProjectVersion(tree, newVersion) {
    const logMessages = [];

    for (const manifestToUpdate of this.manifestsToUpdate) {
      const contents = readTextFile(tree, manifestToUpdate.manifestPath);
      const updatedContents = writeProjectVersion(
        contents,
        newVersion,
        manifestToUpdate.manifestPath,
      );
      tree.write(manifestToUpdate.manifestPath, updatedContents);
      logMessages.push(
        `New version ${newVersion} written to manifest: ${manifestToUpdate.manifestPath}`,
      );
    }

    return logMessages;
  }

  async updateProjectDependencies(_tree, _projectGraph, dependenciesToUpdate) {
    const dependencyNames = Object.keys(dependenciesToUpdate);

    if (dependencyNames.length > 0) {
      throw new Error(
        `Python dependency version updates are not implemented for project "${this.projectGraphNode.name}": ${dependencyNames.join(", ")}`,
      );
    }

    return [];
  }

  getManifestPath() {
    return join(this.projectGraphNode.data.root, "pyproject.toml");
  }
}

function readTextFile(tree, path) {
  const contents = tree.read(path, "utf-8");

  if (typeof contents !== "string") {
    throw new Error(`Unable to read ${path}`);
  }

  return contents;
}

function readProjectVersion(contents, manifestPath) {
  const match = findProjectVersionLine(contents, manifestPath);

  return match.version;
}

function writeProjectVersion(contents, newVersion, manifestPath) {
  const match = findProjectVersionLine(contents, manifestPath);
  const versionLine = match.lines[match.lineIndex];
  const updatedLine = versionLine.replace(
    /^(\s*version\s*=\s*)(["'])([^"'\r\n]+)(\2)(\s*(?:#.*)?(?:\r?\n)?$)/,
    `$1$2${newVersion}$4$5`,
  );

  const updatedLines = [...match.lines];
  updatedLines[match.lineIndex] = updatedLine;

  return updatedLines.join("");
}

function findProjectVersionLine(contents, manifestPath) {
  const lines = contents.match(/[^\n]*(?:\n|$)/g)?.filter((line) => line.length > 0) ?? [];
  const projectTableStart = lines.findIndex((line) => /^\s*\[\s*project\s*]\s*(?:#.*)?$/.test(line));

  if (projectTableStart === -1) {
    throw new Error(`Unable to find [project] table in ${manifestPath}`);
  }

  const nextTableStart = lines.findIndex(
    (line, index) => index > projectTableStart && /^\s*\[/.test(line),
  );
  const projectTableEnd = nextTableStart === -1 ? lines.length : nextTableStart;

  let versionLineIndex = -1;
  let version = null;

  for (let index = projectTableStart + 1; index < projectTableEnd; index += 1) {
    const line = lines[index];
    const versionMatch = /^(\s*)version\s*=\s*(["'])([^"'\r\n]+)\2\s*(?:#.*)?(?:\r?\n)?$/.exec(line);

    if (!versionMatch) {
      continue;
    }

    if (versionLineIndex !== -1) {
      throw new Error(`Found multiple [project].version entries in ${manifestPath}`);
    }

    versionLineIndex = index;
    version = versionMatch[3];
  }

  if (versionLineIndex === -1 || version === null) {
    throw new Error(`Unable to find [project].version in ${manifestPath}`);
  }

  return {
    lines,
    lineIndex: versionLineIndex,
    version,
  };
}

module.exports = PythonVersionActions;
