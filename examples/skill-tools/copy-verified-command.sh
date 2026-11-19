#!/bin/sh
set -eu

skill=$1
command=$2
copy=$3
mkdir -p "$copy"
jq -er --arg command "$command" '.commands[] | select(.path == $command) | (., .resources[]?) | [.path, .bytes, .sha256] | @tsv' "$skill/runtime-files.json" > "$copy/files.tsv"
while read -r file bytes sha256; do
  mkdir -p "$copy/$(dirname "$file")"
  cp "$skill/$file" "$copy/$file"
  test "$(wc -c < "$copy/$file")" -eq "$bytes" || exit 1
  printf '%s  %s\n' "$sha256" "$copy/$file" | shasum -a 256 --check || exit 1
done < "$copy/files.tsv"
