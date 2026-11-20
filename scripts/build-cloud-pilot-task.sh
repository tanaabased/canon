#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo 'Usage: bash scripts/build-cloud-pilot-task.sh <new-scratch-directory>' >&2
  exit 1
fi

mkdir "$1"
cd "$1"
pilot="$PWD"
commit=bb562937e9c29b73f7f551f29a9a9ff72a1c9e27
git init --quiet --template= source
git -C source fetch --quiet --depth=1 https://github.com/tanaabased/codex-tools.git "$commit"
git -C source checkout --quiet --detach "$commit"
cd source
bun install --frozen-lockfile --ignore-scripts >&2
bun run build >&2
tarball=$(npm pack --ignore-scripts --silent --pack-destination "$pilot")
mkdir "$pilot/package"
tar -xzf "$pilot/$tarball" -C "$pilot/package" --strip-components=1
echo "$pilot/package/dist/codex-tools"
