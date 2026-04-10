#!/usr/bin/env bun

import { spawnSync } from 'node:child_process';
import path from 'node:path';

const FAILURE_CONCLUSIONS = new Set([
  'failure',
  'cancelled',
  'timed_out',
  'action_required',
]);

const FAILURE_STATES = new Set([
  'failure',
  'error',
  'cancelled',
  'timed_out',
  'action_required',
]);

const FAILURE_BUCKETS = new Set(['fail']);

const FAILURE_MARKERS = [
  'error',
  'fail',
  'failed',
  'traceback',
  'exception',
  'assert',
  'panic',
  'fatal',
  'timeout',
  'segmentation fault',
];

const DEFAULT_MAX_LINES = 160;
const DEFAULT_CONTEXT_LINES = 30;
const PENDING_LOG_MARKERS = [
  'still in progress',
  'log will be available when it is complete',
];
const ANSI_ESCAPE_PREFIX = '\u001B[';
const BRAND_COLOR = '#00c88a';

function supportsColor(stream = process.stdout) {
  const forceColor = process.env.FORCE_COLOR;
  if (forceColor !== undefined) {
    return !['0', 'false'].includes(forceColor.toLowerCase());
  }

  if (process.env.NO_COLOR !== undefined) {
    return false;
  }

  return Boolean(stream?.isTTY);
}

function applyAnsi(code, text, stream = process.stdout) {
  const value = String(text);
  if (!supportsColor(stream)) {
    return value;
  }

  return `${ANSI_ESCAPE_PREFIX}${code}m${value}${ANSI_ESCAPE_PREFIX}0m`;
}

function applyRgb(hex, text, stream = process.stdout) {
  const value = String(text);
  if (!supportsColor(stream)) {
    return value;
  }

  const normalized = hex.replace(/^#/, '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `${ANSI_ESCAPE_PREFIX}38;2;${red};${green};${blue}m${value}${ANSI_ESCAPE_PREFIX}0m`;
}

function bold(text, stream = process.stdout) {
  return applyAnsi('1', text, stream);
}

function dim(text, stream = process.stdout) {
  return applyAnsi('2', text, stream);
}

function red(text, stream = process.stdout) {
  return applyAnsi('31', text, stream);
}

function tp(text, stream = process.stdout) {
  return applyRgb(BRAND_COLOR, text, stream);
}

function renderHelp() {
  return [
    `Usage: ${bold('inspect-pr-checks.js')} ${dim('[options]')}`,
    '',
    'Inspect failing GitHub PR checks, fetch GitHub Actions logs, and extract a failure snippet.',
    '',
    `${tp('Options')}:`,
    `  --repo <path>           path inside the target Git repository ${dim('[default: .]')}`,
    '  --pr <value>            PR number or URL; defaults to the current branch PR',
    `  --max-lines <count>     maximum snippet or tail size ${dim(`[default: ${DEFAULT_MAX_LINES}]`)}`,
    `  --context <count>       lines of context around the failure marker ${dim(`[default: ${DEFAULT_CONTEXT_LINES}]`)}`,
    '  --json                  emit JSON instead of text output',
    '  -h, --help              show this message',
  ].join('\n');
}

function usage(code = 0) {
  console.log(renderHelp());
  process.exit(code);
}

function fail(message, code = 1) {
  console.error(red('error'), message);
  process.exit(code);
}

function parseIntegerOption(rawValue, optionName) {
  const value = Number.parseInt(String(rawValue), 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${optionName} must be a positive integer.`);
  }
  return value;
}

function parseArgs(argv) {
  const parsed = {
    context: DEFAULT_CONTEXT_LINES,
    json: false,
    maxLines: DEFAULT_MAX_LINES,
    pr: null,
    repo: '.',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '-h' || arg === '--help') {
      usage(0);
    }

    if (arg === '--json') {
      parsed.json = true;
      continue;
    }

    if (!arg.startsWith('--')) {
      throw new Error(`Positional arguments are not supported: ${arg}`);
    }

    const [rawKey, inlineValue] = arg.split(/=(.*)/s, 2);
    const key = rawKey.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const value = inlineValue ?? argv[index + 1];

    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value for ${rawKey}`);
    }

    switch (key) {
      case 'repo':
        parsed.repo = value;
        break;
      case 'pr':
        parsed.pr = value;
        break;
      case 'maxLines':
        parsed.maxLines = parseIntegerOption(value, '--max-lines');
        break;
      case 'context':
        parsed.context = parseIntegerOption(value, '--context');
        break;
      default:
        throw new Error(`Unknown option: ${rawKey}`);
    }

    if (inlineValue === undefined) {
      index += 1;
    }
  }

  return parsed;
}

function runCommand(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
  });

  return {
    error: result.error ?? null,
    returncode: result.status ?? 1,
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? '',
  };
}

function runCommandRaw(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
  });

  return {
    error: result.error ?? null,
    returncode: result.status ?? 1,
    stderr: Buffer.isBuffer(result.stderr) ? result.stderr.toString('utf8') : String(result.stderr ?? ''),
    stdout: Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.from(String(result.stdout ?? '')),
  };
}

function runGhCommand(args, cwd) {
  return runCommand('gh', args, cwd);
}

function runGhCommandRaw(args, cwd) {
  return runCommandRaw('gh', args, cwd);
}

function findGitRoot(start) {
  const result = runCommand('git', ['rev-parse', '--show-toplevel'], start);
  if (result.error || result.returncode !== 0) {
    return null;
  }

  return result.stdout.trim() || null;
}

function ensureGhAvailable(repoRoot) {
  const versionResult = runGhCommand(['--version'], repoRoot);
  if (versionResult.error) {
    return {
      ok: false,
      message: 'gh is not installed or not on PATH.',
    };
  }

  const authResult = runGhCommand(['auth', 'status'], repoRoot);
  if (authResult.returncode === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    message: (authResult.stderr || authResult.stdout || '').trim() || 'gh not authenticated.',
  };
}

function resolvePr(prValue, repoRoot) {
  if (prValue) {
    return prValue;
  }

  const result = runGhCommand(['pr', 'view', '--json', 'number'], repoRoot);
  if (result.returncode !== 0) {
    throw new Error((result.stderr || result.stdout || '').trim() || 'unable to resolve PR.');
  }

  let data;
  try {
    data = JSON.parse(result.stdout || '{}');
  } catch {
    throw new Error('unable to parse PR JSON.');
  }

  if (!data?.number) {
    throw new Error('no PR number found.');
  }

  return String(data.number);
}

function parseAvailableFields(message) {
  if (!message.includes('Available fields:')) {
    return [];
  }

  const fields = [];
  let collecting = false;

  for (const line of message.split('\n')) {
    if (line.includes('Available fields:')) {
      collecting = true;
      continue;
    }

    if (!collecting) {
      continue;
    }

    const field = line.trim();
    if (!field) {
      continue;
    }

    fields.push(field);
  }

  return fields;
}

function fetchChecks(prValue, repoRoot) {
  const primaryFields = ['name', 'state', 'conclusion', 'detailsUrl', 'startedAt', 'completedAt'];
  let result = runGhCommand(['pr', 'checks', prValue, '--json', primaryFields.join(',')], repoRoot);

  if (result.returncode !== 0) {
    const message = [result.stderr, result.stdout].filter(Boolean).join('\n').trim();
    const availableFields = parseAvailableFields(message);

    if (availableFields.length === 0) {
      throw new Error(message || 'gh pr checks failed.');
    }

    const fallbackFields = ['name', 'state', 'bucket', 'link', 'startedAt', 'completedAt', 'workflow'];
    const selectedFields = fallbackFields.filter((field) => availableFields.includes(field));

    if (selectedFields.length === 0) {
      throw new Error('no usable fields available for gh pr checks.');
    }

    result = runGhCommand(['pr', 'checks', prValue, '--json', selectedFields.join(',')], repoRoot);
    if (result.returncode !== 0) {
      throw new Error((result.stderr || result.stdout || '').trim() || 'gh pr checks failed.');
    }
  }

  let data;
  try {
    data = JSON.parse(result.stdout || '[]');
  } catch {
    throw new Error('unable to parse checks JSON.');
  }

  if (!Array.isArray(data)) {
    throw new Error('unexpected checks JSON shape.');
  }

  return data;
}

function normalizeField(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim().toLowerCase();
}

function isFailing(check) {
  const conclusion = normalizeField(check.conclusion);
  if (FAILURE_CONCLUSIONS.has(conclusion)) {
    return true;
  }

  const state = normalizeField(check.state || check.status);
  if (FAILURE_STATES.has(state)) {
    return true;
  }

  return FAILURE_BUCKETS.has(normalizeField(check.bucket));
}

function extractRunId(url) {
  if (!url) {
    return null;
  }

  for (const pattern of [/\/actions\/runs\/(\d+)/, /\/runs\/(\d+)/]) {
    const match = String(url).match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function extractJobId(url) {
  if (!url) {
    return null;
  }

  const directMatch = String(url).match(/\/actions\/runs\/\d+\/job\/(\d+)/);
  if (directMatch) {
    return directMatch[1];
  }

  const fallbackMatch = String(url).match(/\/job\/(\d+)/);
  return fallbackMatch ? fallbackMatch[1] : null;
}

function fetchRunMetadata(runId, repoRoot) {
  const fields = ['conclusion', 'status', 'workflowName', 'name', 'event', 'headBranch', 'headSha', 'url'];
  const result = runGhCommand(['run', 'view', runId, '--json', fields.join(',')], repoRoot);
  if (result.returncode !== 0) {
    return null;
  }

  try {
    const data = JSON.parse(result.stdout || '{}');
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

function fetchRunLog(runId, repoRoot) {
  const result = runGhCommand(['run', 'view', runId, '--log'], repoRoot);
  if (result.returncode !== 0) {
    return {
      error: (result.stderr || result.stdout || '').trim() || 'gh run view failed',
      text: '',
    };
  }

  return {
    error: '',
    text: result.stdout,
  };
}

function fetchRepoSlug(repoRoot) {
  const result = runGhCommand(['repo', 'view', '--json', 'nameWithOwner'], repoRoot);
  if (result.returncode !== 0) {
    return null;
  }

  try {
    const data = JSON.parse(result.stdout || '{}');
    return data?.nameWithOwner ? String(data.nameWithOwner) : null;
  } catch {
    return null;
  }
}

function isZipPayload(payload) {
  return payload.subarray(0, 2).equals(Buffer.from('PK'));
}

function fetchJobLog(jobId, repoRoot) {
  const repoSlug = fetchRepoSlug(repoRoot);
  if (!repoSlug) {
    return {
      error: 'Error: unable to resolve repository name for job logs.',
      text: '',
    };
  }

  const endpoint = `/repos/${repoSlug}/actions/jobs/${jobId}/logs`;
  const result = runGhCommandRaw(['api', endpoint], repoRoot);
  if (result.returncode !== 0) {
    return {
      error: (result.stderr || result.stdout.toString('utf8')).trim() || 'gh api job logs failed',
      text: '',
    };
  }

  if (isZipPayload(result.stdout)) {
    return {
      error: 'Job logs returned a zip archive; unable to parse.',
      text: '',
    };
  }

  return {
    error: '',
    text: result.stdout.toString('utf8'),
  };
}

function isLogPendingMessage(message) {
  const lowered = String(message).toLowerCase();
  return PENDING_LOG_MARKERS.some((marker) => lowered.includes(marker));
}

function fetchCheckLog({ runId, jobId, repoRoot }) {
  const runLog = fetchRunLog(runId, repoRoot);
  if (!runLog.error) {
    return { status: 'ok', text: runLog.text, error: '' };
  }

  if (isLogPendingMessage(runLog.error) && jobId) {
    const jobLog = fetchJobLog(jobId, repoRoot);
    if (jobLog.text) {
      return { status: 'ok', text: jobLog.text, error: '' };
    }

    if (jobLog.error && isLogPendingMessage(jobLog.error)) {
      return { status: 'pending', text: '', error: jobLog.error };
    }

    if (jobLog.error) {
      return { status: 'error', text: '', error: jobLog.error };
    }
  }

  if (isLogPendingMessage(runLog.error)) {
    return { status: 'pending', text: '', error: runLog.error };
  }

  return { status: 'error', text: '', error: runLog.error };
}

function findFailureIndex(lines) {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const lowered = lines[index].toLowerCase();
    if (FAILURE_MARKERS.some((marker) => lowered.includes(marker))) {
      return index;
    }
  }

  return null;
}

function tailLines(text, maxLines) {
  if (maxLines <= 0) {
    return '';
  }

  const lines = String(text).split('\n');
  return lines.slice(-maxLines).join('\n').trimEnd();
}

function extractFailureSnippet(logText, { context, maxLines }) {
  const lines = String(logText).split('\n');
  if (lines.length === 0) {
    return '';
  }

  const markerIndex = findFailureIndex(lines);
  if (markerIndex === null) {
    return tailLines(logText, maxLines);
  }

  const start = Math.max(0, markerIndex - context);
  const end = Math.min(lines.length, markerIndex + context);
  const window = lines.slice(start, end).slice(-maxLines);
  return window.join('\n').trimEnd();
}

function analyzeCheck(check, { context, maxLines, repoRoot }) {
  const detailsUrl = check.detailsUrl || check.link || '';
  const runId = extractRunId(detailsUrl);
  const jobId = extractJobId(detailsUrl);
  const base = {
    detailsUrl,
    jobId,
    name: check.name || '',
    runId,
  };

  if (!runId) {
    return {
      ...base,
      note: 'No GitHub Actions run id detected in detailsUrl.',
      status: 'external',
    };
  }

  const run = fetchRunMetadata(runId, repoRoot);
  const logResult = fetchCheckLog({ runId, jobId, repoRoot });

  if (logResult.status === 'pending') {
    return {
      ...base,
      note: logResult.error || 'Logs are not available yet.',
      run: run || undefined,
      status: 'log_pending',
    };
  }

  if (logResult.error) {
    return {
      ...base,
      error: logResult.error,
      run: run || undefined,
      status: 'log_unavailable',
    };
  }

  return {
    ...base,
    logSnippet: extractFailureSnippet(logResult.text, { context, maxLines }),
    logTail: tailLines(logResult.text, maxLines),
    run: run || {},
    status: 'ok',
  };
}

function indentBlock(text, prefix = '  ') {
  return String(text)
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

function renderResults(prNumber, results) {
  console.log(`PR #${prNumber}: ${results.length} failing checks analyzed.`);

  for (const result of results) {
    console.log('-'.repeat(60));
    console.log(`Check: ${result.name || ''}`);

    if (result.detailsUrl) {
      console.log(`Details: ${result.detailsUrl}`);
    }

    if (result.runId) {
      console.log(`Run ID: ${result.runId}`);
    }

    if (result.jobId) {
      console.log(`Job ID: ${result.jobId}`);
    }

    console.log(`Status: ${result.status || 'unknown'}`);

    const runMeta = result.run || {};
    if (Object.keys(runMeta).length > 0) {
      const branch = runMeta.headBranch || '';
      const sha = String(runMeta.headSha || '').slice(0, 12);
      const workflow = runMeta.workflowName || runMeta.name || '';
      const conclusion = runMeta.conclusion || runMeta.status || '';
      console.log(`Workflow: ${workflow} (${conclusion})`);
      if (branch || sha) {
        console.log(`Branch/SHA: ${branch} ${sha}`.trimEnd());
      }
      if (runMeta.url) {
        console.log(`Run URL: ${runMeta.url}`);
      }
    }

    if (result.note) {
      console.log(`Note: ${result.note}`);
    }

    if (result.error) {
      console.log(`Error fetching logs: ${result.error}`);
      continue;
    }

    if (result.logSnippet) {
      console.log('Failure snippet:');
      console.log(indentBlock(result.logSnippet));
    } else {
      console.log('No snippet available.');
    }
  }

  console.log('-'.repeat(60));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findGitRoot(path.resolve(args.repo));
  if (!repoRoot) {
    fail('not inside a Git repository.');
  }

  const ghStatus = ensureGhAvailable(repoRoot);
  if (!ghStatus.ok) {
    fail(ghStatus.message);
  }

  const prValue = resolvePr(args.pr, repoRoot);
  const checks = fetchChecks(prValue, repoRoot);
  const failing = checks.filter(isFailing);

  if (failing.length === 0) {
    if (args.json) {
      console.log(JSON.stringify({ pr: prValue, results: [] }, null, 2));
      return;
    }

    console.log(`PR #${prValue}: no failing checks detected.`);
    return;
  }

  const results = failing.map((check) =>
    analyzeCheck(check, {
      context: args.context,
      maxLines: args.maxLines,
      repoRoot,
    }),
  );

  if (args.json) {
    console.log(JSON.stringify({ pr: prValue, results }, null, 2));
    process.exitCode = 1;
    return;
  }

  renderResults(prValue, results);
  process.exitCode = 1;
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
