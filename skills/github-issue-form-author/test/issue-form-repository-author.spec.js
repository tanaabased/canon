import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

import { authorIssueFormSet } from '../lib/issue-form-author.js';
import { alignGitHubIssueForms } from '../lib/issue-form-repository-author.js';
import { serializeYaml } from '../utils/serialize-yaml.js';
import { fakeIssueFormClient } from './fake-issue-form-client.js';

const TARGET = 'tanaabased/agent-system-test';

function authorize(preview) {
  return {
    approvedRepository: preview.authorization.repository,
    approvedBranch: preview.authorization.branch,
    approvedDigest: preview.authorization.digest,
  };
}

function renderedFiles(mode = 'organization') {
  return Object.fromEntries(
    authorIssueFormSet(mode).files.map(({ path, content }) => [path, content]),
  );
}

function parsedByBun(content) {
  const result = spawnSync(
    'bun',
    [
      '-e',
      'const text = await Bun.stdin.text(); process.stdout.write(JSON.stringify(Bun.YAML.parse(text)));',
    ],
    { encoding: 'utf8', input: content },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

describe('skills/github-issue-form-author/lib/issue-form-repository-author', () => {
  it('should preview exactly four creates and no deletions for an empty template directory', () => {
    const client = fakeIssueFormClient();
    const report = alignGitHubIssueForms(TARGET, { client });

    assert.equal(report.status, 'approval_required');
    assert.equal(report.mutatesGitHub, false);
    assert.equal(report.repositoryMode, 'organization');
    assert.equal(report.plannedMutation.operations.length, 4);
    assert.ok(report.plannedMutation.operations.every(({ kind }) => kind === 'create_file'));
    assert.deepEqual(report.plannedMutation.deletions, []);
    assert.match(report.authorization.digest, /^sha256:[a-f0-9]{64}$/);
    assert.equal(
      client.calls.some(({ operation }) => operation === 'putFile'),
      false,
    );
  });

  it('should create, exactly verify, and then idempotently align all four files', () => {
    const client = fakeIssueFormClient();
    const preview = alignGitHubIssueForms(TARGET, { client });
    const report = alignGitHubIssueForms(TARGET, {
      client,
      authorization: authorize(preview),
    });

    assert.equal(report.status, 'aligned_after_write');
    assert.equal(report.mutatesGitHub, true);
    assert.equal(report.writes.length, 4);
    assert.ok(report.writes.every(({ status }) => status === 'succeeded'));
    assert.equal(report.verification.status, 'verified');

    const aligned = alignGitHubIssueForms(TARGET, { client });
    assert.equal(aligned.status, 'aligned');
    assert.deepEqual(aligned.plannedMutation.operations, []);
  });

  it('should update drift while preserving compatible repository additions and unknown files', () => {
    const desired = authorIssueFormSet('organization');
    const task = structuredClone(desired.files.find(({ kind }) => kind === 'task').document);
    task.title = '[Work]: ';
    task.assignees = ['maintainer'];
    task.projects = ['tanaabased/1'];
    task.description = 'Old description';
    const config = {
      blank_issues_enabled: true,
      contact_links: [
        { name: 'Support', url: 'https://example.com/support', about: 'Ask for help.' },
      ],
    };
    const files = renderedFiles();
    files['.github/ISSUE_TEMPLATE/task.yml'] = serializeYaml(task);
    files['.github/ISSUE_TEMPLATE/config.yml'] = serializeYaml(config);
    const client = fakeIssueFormClient({
      files,
      unmanagedFiles: [
        { path: '.github/ISSUE_TEMPLATE/security.md', sha: 'unmanaged', type: 'file' },
      ],
    });

    const preview = alignGitHubIssueForms(TARGET, { client });
    assert.equal(preview.plannedMutation.operations.length, 2);
    assert.deepEqual(preview.plannedMutation.deletions, []);
    assert.deepEqual(preview.plannedMutation.unmanagedFiles, [
      { path: '.github/ISSUE_TEMPLATE/security.md', sha: 'unmanaged', type: 'file' },
    ]);

    const report = alignGitHubIssueForms(TARGET, {
      client,
      authorization: authorize(preview),
    });
    assert.equal(report.status, 'aligned_after_write');
    const updatedTask = parsedByBun(
      client.state.files.get('.github/ISSUE_TEMPLATE/task.yml').content,
    );
    const updatedConfig = parsedByBun(
      client.state.files.get('.github/ISSUE_TEMPLATE/config.yml').content,
    );
    assert.equal(updatedTask.title, '[Work]: ');
    assert.deepEqual(updatedTask.assignees, ['maintainer']);
    assert.deepEqual(updatedTask.projects, ['tanaabased/1']);
    assert.deepEqual(updatedConfig.contact_links, config.contact_links);
    assert.equal(client.state.unmanagedFiles[0].path, '.github/ISSUE_TEMPLATE/security.md');
  });

  it('should preserve compatible Markdown guidance without changing submitted input semantics', () => {
    const files = renderedFiles('personal');
    const task = parsedByBun(files['.github/ISSUE_TEMPLATE/task.yml']);
    task.description = 'Old description';
    task.body.unshift({
      type: 'markdown',
      attributes: { value: 'Repository-specific contribution guidance.' },
    });
    files['.github/ISSUE_TEMPLATE/task.yml'] = serializeYaml(task);
    const client = fakeIssueFormClient({ ownerType: 'User', files });

    const preview = alignGitHubIssueForms('pirog/personal-project', { client });
    assert.equal(preview.status, 'approval_required');
    const report = alignGitHubIssueForms('pirog/personal-project', {
      client,
      authorization: authorize(preview),
    });
    const updatedTask = parsedByBun(
      client.state.files.get('.github/ISSUE_TEMPLATE/task.yml').content,
    );

    assert.equal(report.status, 'aligned_after_write');
    assert.equal(
      updatedTask.body[0].attributes.value,
      'Repository-specific contribution guidance.',
    );
  });

  it('should retire only inputs owned by the previous canonical form projection', () => {
    const files = renderedFiles('organization');
    const task = parsedByBun(files['.github/ISSUE_TEMPLATE/task.yml']);
    task.body[0].attributes.value =
      'Provide supported evidence and leave uncertain estimates unset. Task score is calculated after submission; do not calculate it here.';
    task.body.push(
      {
        type: 'textarea',
        id: 'acceptance-criteria',
        attributes: { label: 'Acceptance criteria' },
      },
      {
        type: 'dropdown',
        id: 'urgency',
        attributes: { label: 'Urgency assessment', options: ['Moderate', 'High'] },
      },
    );
    files['.github/ISSUE_TEMPLATE/task.yml'] = serializeYaml(task);
    const client = fakeIssueFormClient({ files });

    const preview = alignGitHubIssueForms(TARGET, { client });
    assert.equal(preview.status, 'approval_required');
    assert.equal(preview.blockers.length, 0);
    const report = alignGitHubIssueForms(TARGET, {
      client,
      authorization: authorize(preview),
    });
    const updated = parsedByBun(client.state.files.get('.github/ISSUE_TEMPLATE/task.yml').content);

    assert.equal(report.status, 'aligned_after_write');
    assert.deepEqual(
      updated.body.filter(({ type }) => type !== 'markdown').map(({ id }) => id),
      ['change', 'success', 'additional-context'],
    );
  });

  it('should block incompatible custom inputs, auto-applied labels, invalid YAML, and unsupported keys', () => {
    const desiredTask = authorIssueFormSet('organization').files.find(
      ({ kind }) => kind === 'task',
    ).document;
    const cases = [
      serializeYaml({
        ...desiredTask,
        body: [
          ...desiredTask.body,
          {
            type: 'input',
            id: 'customer-id',
            attributes: { label: 'Customer ID' },
          },
        ],
      }),
      serializeYaml({ ...desiredTask, labels: ['needs-triage'] }),
      serializeYaml({
        ...desiredTask,
        body: [
          ...desiredTask.body,
          {
            type: 'dropdown',
            id: 'priority',
            attributes: { label: 'Customer priority', options: ['High', 'Low'] },
          },
        ],
      }),
      'name: [invalid\n',
      serializeYaml({ ...desiredTask, unsupported: true }),
    ];

    for (const content of cases) {
      const client = fakeIssueFormClient({
        files: { '.github/ISSUE_TEMPLATE/task.yml': content },
      });
      const report = alignGitHubIssueForms(TARGET, { client });
      assert.equal(report.status, 'blocked');
      assert.equal(report.mutatesGitHub, false);
      assert.ok(report.blockers.length > 0);
      assert.equal(
        client.calls.some(({ operation }) => operation === 'putFile'),
        false,
      );
    }
  });

  it('should reject stale authorization after repository drift changes the exact plan', () => {
    const client = fakeIssueFormClient();
    const preview = alignGitHubIssueForms(TARGET, { client });
    client.state.files.set('.github/ISSUE_TEMPLATE/task.yml', {
      content: authorIssueFormSet('organization').files[0].content,
      sha: 'external-change',
    });

    const report = alignGitHubIssueForms(TARGET, {
      client,
      authorization: authorize(preview),
    });
    assert.equal(report.status, 'approval_required');
    assert.equal(report.authorization.approved, false);
    assert.match(report.authorization.reasons.join(' '), /digest/);
    assert.equal(
      client.calls.some(({ operation }) => operation === 'putFile'),
      false,
    );
  });

  it('should stop on a SHA conflict and report partial success without rollback', () => {
    const client = fakeIssueFormClient({ failAt: 2 });
    const preview = alignGitHubIssueForms(TARGET, { client });
    const report = alignGitHubIssueForms(TARGET, {
      client,
      authorization: authorize(preview),
    });

    assert.equal(report.status, 'partial');
    assert.equal(report.mutatesGitHub, true);
    assert.deepEqual(
      report.writes.map(({ status }) => status),
      ['succeeded', 'failed'],
    );
    assert.equal(report.verification.status, 'drifted');
    assert.equal(client.calls.filter(({ operation }) => operation === 'putFile').length, 2);
  });

  it('should infer the personal fallback variant from a user-owned repository', () => {
    const client = fakeIssueFormClient({ ownerType: 'User' });
    const report = alignGitHubIssueForms('pirog/personal-project', { client });
    const taskContent = report.plannedMutation.operations.find(({ path }) =>
      path.endsWith('task.yml'),
    ).after.content;
    const task = parsedByBun(taskContent);

    assert.equal(report.repositoryMode, 'personal');
    assert.equal(Object.hasOwn(task, 'type'), false);
    assert.deepEqual(
      task.body.filter(({ type }) => type !== 'markdown').map(({ id }) => id),
      ['change', 'success', 'additional-context'],
    );
  });
});
