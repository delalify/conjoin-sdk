#!/bin/bash
set -e

SPEC_FILE="$(dirname "$0")/../openapi.json"

if [ ! -f "$SPEC_FILE" ]; then
  echo "Error: OpenAPI spec not found at $SPEC_FILE"
  exit 1
fi

node -e "
  const spec = JSON.parse(require('fs').readFileSync('$SPEC_FILE', 'utf8'));
  if (!spec.openapi) {
    console.error('Error: Missing openapi version field');
    process.exit(1);
  }
  if (!spec.info || !spec.info.title) {
    console.error('Error: Missing info.title field');
    process.exit(1);
  }
  if (!spec.paths && spec.paths !== undefined) {
    console.error('Error: Missing paths field');
    process.exit(1);
  }
  console.log('Spec validation passed: ' + spec.info.title + ' v' + spec.info.version);
"
