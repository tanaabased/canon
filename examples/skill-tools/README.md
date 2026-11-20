# Packaged Skill Tools

Exercise Canon's bundled commands from a candidate npm tarball without checkout dependencies. The Examples workflow supplies `CANON_TARBALL`, Bun, and Leia's isolated `TMPDIR`. No GitHub access or host installation is needed.

This scenario covers packaged command loading, skill scaffolding and validation, read-only task inspection against a fixture, malformed-input rejection, and issue-form rendering. It does not perform authenticated GitHub operations or prove their remote effects. Native plugin loading belongs in [OpenClaw installation](../openclaw/README.md), and standalone starter behavior belongs in [CLI templates](../cli-templates/README.md).

## Setup

```bash
# should extract the candidate outside the checkout
mkdir -p "$TMPDIR/package"
tar -xzf "$CANON_TARBALL" -C "$TMPDIR/package" --strip-components=1
```

## Testing

```bash
# should load every inventoried command from a verified copy
scenario="$PWD"
cd "$TMPDIR"
for inventory in "$TMPDIR"/package/skills/*/runtime-files.json; do
  skill="$(dirname "$inventory")"
  jq -er '.commands[].path' "$inventory" > "$TMPDIR/commands.txt"
  while IFS= read -r command; do
    copy="$TMPDIR/help/$(basename "$skill")/$(basename "$command" .js)"
    sh "$scenario/copy-verified-command.sh" "$skill" "$command" "$copy"
    bun --no-install "$copy/$command" --help
  done < "$TMPDIR/commands.txt"
done

# should scaffold and validate using only readable runtime files
scenario="$PWD"
cd "$TMPDIR"
skill="$TMPDIR/package/skills/skill-author"
copy="$TMPDIR/copied-skill"
command="scripts/init-skill.js"
jq -e --arg command "$command" '.commands[] | select(.path == $command) | (.resources | map(.path | split(".") | last) | sort) == ["svg", "txt"]' "$skill/runtime-files.json"
sh "$scenario/copy-verified-command.sh" "$skill" "$command" "$copy"
bun --no-install "$copy/$command" --type generic --slug example-skill --display-name 'Example Skill' --description 'Scaffold a focused example skill.' --openclaw-emoji '🧩' --openclaw-homepage https://example.com/skills/example-skill --container standalone --output-dir "$TMPDIR/standalone"
generated="$TMPDIR/standalone/tanaab-example-skill"
cd "$generated/assets"
shasum -a 256 --check <<'SHA256'
991a99c4e07f2d6c44966965b4ea2518f2beaccb6e3ea60a1386d8d62077b771  icon-large.png
6be13090673ec8f21e504d68f2799b900efda96ebab590b88b64327273a01c3c  icon-small.svg
SHA256
validator="$TMPDIR/copied-validator"
sh "$scenario/copy-verified-command.sh" "$skill" scripts/validate-skill.js "$validator"
cd "$TMPDIR"
bun --no-install "$validator/scripts/validate-skill.js" --skill-dir "$generated" --container standalone
bun -e 'import assert from "node:assert/strict"; const s=await Bun.file(process.argv[1]).text(); const f=Bun.YAML.parse(s.split("---")[1]); assert.equal(f.name,"tanaab-example-skill"); assert.equal(f.metadata.openclaw.emoji,"🧩"); assert.equal(f.metadata.openclaw.homepage,"https://example.com/skills/example-skill");' "$TMPDIR/standalone/tanaab-example-skill/SKILL.md"

# should inspect a fixture issue from a verified Task Decomposer command copy
copy="$TMPDIR/copied-decomposer"
command="scripts/inspect-task-decomposition.js"
sh ./copy-verified-command.sh "$TMPDIR/package/skills/task-decomposer" "$command" "$copy"
mkdir -p "$TMPDIR/fixture-bin"
cp ./inspector-gh.sh "$TMPDIR/fixture-bin/gh"
chmod +x "$TMPDIR/fixture-bin/gh"
bun_path="$(command -v bun)"
cd "$TMPDIR"
PATH="$TMPDIR/fixture-bin" "$bun_path" --no-install "$copy/$command" acme/widgets#7 --json > evidence.json
jq -e '.status == "ready" and .mutatesGitHub == false and .target.slug == "acme/widgets" and .issue.number == 7 and .issue.title == "fixture parent" and .warnings == []' evidence.json

# should preserve a custom namespace and plugin identity
cd "$TMPDIR"
bun --no-install "$TMPDIR/package/skills/skill-author/scripts/init-skill.js" --type integration --namespace agent-system --container openclaw-plugin --slug github-cli --display-name 'Agent System GitHub CLI' --description 'Agent System GitHub CLI guidance for agent-scoped operations.' --brand-color '#123456' --openclaw-emoji '🐙' --openclaw-homepage https://example.com/skills/github-cli --output-dir "$TMPDIR/custom"
bun --no-install "$TMPDIR/package/skills/skill-author/scripts/validate-skill.js" --skill-dir "$TMPDIR/custom/github-cli" --namespace agent-system --container openclaw-plugin
bun -e 'import assert from "node:assert/strict"; const s=await Bun.file(process.argv[1]).text(); const f=Bun.YAML.parse(s.split("---")[1]); assert.equal(f.name,"agent-system-github-cli"); assert.equal(f.description,"Agent System GitHub CLI guidance for agent-scoped operations."); assert.equal(f.metadata.owner,"tanaab"); const a=Bun.YAML.parse(await Bun.file(process.argv[2]).text()); assert.equal(a.interface.brand_color,"#123456"); assert.match(a.interface.default_prompt,/\$agent-system-github-cli/); assert.doesNotMatch(JSON.stringify(a),/Tanaab-based/);' "$TMPDIR/custom/github-cli/SKILL.md" "$TMPDIR/custom/github-cli/agents/openai.yaml"

# should scaffold and validate explicit ownership independently of namespace
cd "$TMPDIR"
bun --no-install "$TMPDIR/package/skills/skill-author/scripts/init-skill.js" --type generic --owner pirog --namespace piro --container codex-plugin --category-tag skills --slug example --display-name 'Example' --description 'Create a focused example skill.' --openclaw-emoji '🧩' --openclaw-homepage https://example.com/skills/example --output-dir "$TMPDIR/pirog"
bun --no-install "$TMPDIR/package/skills/skill-author/scripts/validate-skill.js" --skill-dir "$TMPDIR/pirog/example" --owner pirog --namespace piro --container codex-plugin
bun -e 'import assert from "node:assert/strict"; const s=await Bun.file(process.argv[1]).text(); const f=Bun.YAML.parse(s.split("---")[1]); assert.equal(f.name,"piro-example"); assert.equal(f.metadata.owner,"pirog"); assert.deepEqual(f.metadata.tags,["pirog","generic","skills"]);' "$TMPDIR/pirog/example/SKILL.md"
status=0
bun --no-install "$TMPDIR/package/skills/skill-author/scripts/validate-skill.js" --skill-dir "$TMPDIR/pirog/example" --namespace piro --container codex-plugin > "$TMPDIR/owner.log" 2>&1 || status=$?
cat "$TMPDIR/owner.log"
test "$status" -eq 1
grep -F 'must match the requested owner' "$TMPDIR/owner.log"

# should reject missing frontmatter and interface metadata
mkdir -p "$TMPDIR/malformed"
cp missing-frontmatter.md "$TMPDIR/malformed/SKILL.md"
status=0
bun --no-install "$TMPDIR/package/skills/skill-author/scripts/validate-skill.js" --skill-dir "$TMPDIR/malformed" > "$TMPDIR/malformed.log" 2>&1 || status=$?
cat "$TMPDIR/malformed.log"
test "$status" -eq 1
grep -F 'frontmatter' "$TMPDIR/malformed.log"
grep -F 'agents/openai.yaml' "$TMPDIR/malformed.log"

# should reject missing openclaw metadata
mkdir -p "$TMPDIR/tanaab-example/agents"
cp missing-openclaw.md "$TMPDIR/tanaab-example/SKILL.md"
cp empty-interface.yaml "$TMPDIR/tanaab-example/agents/openai.yaml"
status=0
bun --no-install "$TMPDIR/package/skills/skill-author/scripts/validate-skill.js" --skill-dir "$TMPDIR/tanaab-example" > "$TMPDIR/metadata.log" 2>&1 || status=$?
cat "$TMPDIR/metadata.log"
test "$status" -eq 1
grep -F "metadata must contain 'openclaw'" "$TMPDIR/metadata.log"

# should render every issue form from a verified command copy
copy="$TMPDIR/copied-issue-forms"
command="scripts/render-issue-forms.js"
sh ./copy-verified-command.sh "$TMPDIR/package/skills/github-issue-form-author" "$command" "$copy"
cd "$TMPDIR"
bun --no-install "$copy/$command" render --repository-mode organization --json | bun -e 'import assert from "node:assert/strict"; const r=await Bun.stdin.json(); assert.equal(r.mutatesGitHub,false); assert.deepEqual(r.files.map(f=>f.path).sort(),[".github/ISSUE_TEMPLATE/bug.yml",".github/ISSUE_TEMPLATE/config.yml",".github/ISSUE_TEMPLATE/feature.yml",".github/ISSUE_TEMPLATE/task.yml"]); for(const f of r.files) assert.ok(Bun.YAML.parse(f.content));'
```
