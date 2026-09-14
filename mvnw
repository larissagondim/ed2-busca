#!/bin/sh
set -eu
BASE_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
DIST_URL=$(sed -n 's/^distributionUrl=//p' "$BASE_DIR/.mvn/wrapper/maven-wrapper.properties")
MAVEN_HOME_DIR="$BASE_DIR/.mvn/apache-maven-3.9.11"
if [ ! -x "$MAVEN_HOME_DIR/bin/mvn" ]; then
  ARCHIVE="$BASE_DIR/.mvn/apache-maven.zip"
  curl -fsSL "$DIST_URL" -o "$ARCHIVE"
  unzip -q "$ARCHIVE" -d "$BASE_DIR/.mvn"
  rm -f "$ARCHIVE"
fi
exec "$MAVEN_HOME_DIR/bin/mvn" "$@"
