# Packaged Skill Tools

Exercise Canon's bundled commands from a candidate npm tarball without checkout dependencies. The Examples workflow supplies `CANON_TARBALL`, Bun, and Leia's isolated `TMPDIR`. No GitHub access or host installation is needed.

## Setup

```bash
# should extract the candidate outside the checkout
mkdir -p "$TMPDIR/package"
tar -xzf "$CANON_TARBALL" -C "$TMPDIR/package" --strip-components=1
```

## Testing

```bash
# should load every packaged command without development dependencies
cd "$TMPDIR/package"
for command in skills/*/scripts/*.js; do
  bun --no-install "$command" --help
 done

# should scaffold and validate a standalone skill
cd "$TMPDIR"
bun --no-install "$TMPDIR/package/skills/skill-author/scripts/init-skill.js" --type generic --slug example-skill --display-name 'Example Skill' --description 'Scaffold a focused example skill.' --openclaw-emoji '🧩' --openclaw-homepage https://example.com/skills/example-skill --container standalone --output-dir "$TMPDIR/standalone"
bun --no-install "$TMPDIR/package/skills/skill-author/scripts/validate-skill.js" --skill-dir "$TMPDIR/standalone/tanaab-example-skill" --container standalone
bun -e 'import assert from "node:assert/strict"; const s=await Bun.file(process.argv[1]).text(); const f=Bun.YAML.parse(s.split("---")[1]); assert.equal(f.name,"tanaab-example-skill"); assert.equal(f.metadata.openclaw.emoji,"🧩"); assert.equal(f.metadata.openclaw.homepage,"https://example.com/skills/example-skill");' "$TMPDIR/standalone/tanaab-example-skill/SKILL.md"

# should preserve a custom namespace and plugin identity
cd "$TMPDIR"
bun --no-install "$TMPDIR/package/skills/skill-author/scripts/init-skill.js" --type integration --namespace agent-system --container openclaw-plugin --slug github-cli --display-name 'Agent System GitHub CLI' --description 'Agent System GitHub CLI guidance for agent-scoped operations.' --brand-color '#123456' --openclaw-emoji '🐙' --openclaw-homepage https://example.com/skills/github-cli --output-dir "$TMPDIR/custom"
bun --no-install "$TMPDIR/package/skills/skill-author/scripts/validate-skill.js" --skill-dir "$TMPDIR/custom/github-cli" --namespace agent-system --container openclaw-plugin
bun -e 'import assert from "node:assert/strict"; const s=await Bun.file(process.argv[1]).text(); const f=Bun.YAML.parse(s.split("---")[1]); assert.equal(f.name,"agent-system-github-cli"); assert.equal(f.description,"Agent System GitHub CLI guidance for agent-scoped operations."); assert.equal(f.metadata.owner,"tanaab"); const a=Bun.YAML.parse(await Bun.file(process.argv[2]).text()); assert.equal(a.interface.brand_color,"#123456"); assert.match(a.interface.default_prompt,/\$agent-system-github-cli/); assert.doesNotMatch(JSON.stringify(a),/Tanaab-based/);' "$TMPDIR/custom/github-cli/SKILL.md" "$TMPDIR/custom/github-cli/agents/openai.yaml"

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

# should render every issue form from the package
cd "$TMPDIR"
bun --no-install "$TMPDIR/package/skills/github-issue-form-author/scripts/render-issue-forms.js" render --repository-mode organization --json | bun -e 'import assert from "node:assert/strict"; const r=await Bun.stdin.json(); assert.equal(r.mutatesGitHub,false); assert.deepEqual(r.files.map(f=>f.path).sort(),[".github/ISSUE_TEMPLATE/bug.yml",".github/ISSUE_TEMPLATE/config.yml",".github/ISSUE_TEMPLATE/feature.yml",".github/ISSUE_TEMPLATE/task.yml"]); for(const f of r.files) assert.ok(Bun.YAML.parse(f.content));'
```
