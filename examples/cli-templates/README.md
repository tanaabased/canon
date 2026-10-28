# Packaged CLI Templates

Build the shipped Bun starter in a disposable consumer and exercise its standalone output alongside the shipped shell starters. The Examples workflow supplies `CANON_TARBALL`, Bun, Bash, and the hosted Ubuntu runner's PowerShell. No checkout dependency or Git history may supply the resulting CLI behavior.

This scenario covers packaged starter preparation, the Bun build, and help and fallback-version output for Bun, Bash, and PowerShell. It does not exercise every option or environment override. Bundled skill commands belong in [skill tools](../skill-tools/README.md); native plugin loading belongs in [OpenClaw installation](../openclaw/README.md). Results apply to the hosted Ubuntu environment, not every supported shell platform.

## Setup

```bash
# should prepare the shipped starters in an isolated consumer
mkdir -p "$TMPDIR/package" "$TMPDIR/consumer/bin" "$TMPDIR/standalone"
tar -xzf "$CANON_TARBALL" -C "$TMPDIR/package" --strip-components=1
cp consumer-package.json "$TMPDIR/consumer/package.json"
cp "$TMPDIR/package/skills/javascript-cli-author/templates/bun-cli.js" "$TMPDIR/consumer/bin/"
cp "$TMPDIR/package/skills/shell-cli-author/templates/bash-cli.sh" "$TMPDIR/standalone/"
cp "$TMPDIR/package/skills/shell-cli-author/templates/powershell-cli.ps1" "$TMPDIR/standalone/"

# should build a standalone bun bundle from the copied starter
cd "$TMPDIR/consumer"
bun install --ignore-scripts
bun build bin/bun-cli.js --target=bun --outfile="$TMPDIR/standalone/bun-cli.js"
chmod +x "$TMPDIR/standalone/bun-cli.js"
```

## Testing

```bash
# should expose help through the built bun entrypoint
cd "$TMPDIR/standalone"
help="$(NO_COLOR=1 ./bun-cli.js --help)"
grep -F 'Usage: bun-cli.js' <<< "$help"
grep -Fx 'Options:' <<< "$help"
grep -Fx 'Environment Variables:' <<< "$help"

# should use the bun version fallback without checkout history
cd "$TMPDIR/standalone"
test "$(./bun-cli.js --version)" = '0.0.0-unreleased'

# should parse and expose bash help
cd "$TMPDIR/standalone"
bash -n bash-cli.sh
help="$(NO_COLOR=1 ./bash-cli.sh --help)"
grep -F 'Usage: bash-cli.sh' <<< "$help"
grep -Fx 'Options:' <<< "$help"

# should use the bash version fallback without checkout history
cd "$TMPDIR/standalone"
unset SCRIPT_VERSION
test "$(./bash-cli.sh --version)" = '0.0.0-unreleased'

# should parse and expose powershell help
cd "$TMPDIR/standalone"
pwsh -NoProfile -Command '$tokens=$null; $parseErrors=$null; [System.Management.Automation.Language.Parser]::ParseFile((Join-Path (Get-Location) "powershell-cli.ps1"), [ref]$tokens, [ref]$parseErrors) > $null; if ($parseErrors.Count) { $parseErrors; exit 1 }'
help="$(NO_COLOR=1 pwsh -NoProfile -File powershell-cli.ps1 -Help)"
grep -F 'Usage: powershell-cli.ps1' <<< "$help"
grep -Fx 'Options:' <<< "$help"

# should use the powershell version fallback without checkout history
cd "$TMPDIR/standalone"
unset SCRIPT_VERSION
test "$(pwsh -NoProfile -File powershell-cli.ps1 -Version)" = '0.0.0-unreleased'
```
