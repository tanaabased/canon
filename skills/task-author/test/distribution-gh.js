#!/usr/bin/env bun

import { appendFileSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const fixture = JSON.parse(readFileSync(process.env.TASK_AUTHOR_GH_FIXTURE, 'utf8'));
appendFileSync(
  process.env.TASK_AUTHOR_GH_LOG,
  `${JSON.stringify({
    args,
    cwd: process.cwd(),
    marker: process.env.TASK_AUTHOR_ROUTING_MARKER,
  })}\n`,
);

if (fixture.denial) {
  process.stderr.write('fixture routing denied\n');
  process.exit(1);
}
if (args[0] === '--version' || args[0] === 'auth') process.exit(0);
if (args[0] === 'repo') {
  process.stdout.write(JSON.stringify({ nameWithOwner: 'acme/widgets' }));
  process.exit(0);
}
const methodIndex = args.indexOf('--method');
if (methodIndex >= 0 && args[methodIndex + 1] !== 'GET') {
  process.stderr.write('unexpected mutation in distribution test\n');
  process.exit(77);
}
const responses = {
  '/repos/acme/widgets': { owner: { login: 'acme', type: 'Organization' }, private: false },
  '/repos/acme/widgets/issue-types': fixture.capabilities.issueTypes.values.map((type) => ({
    ...type,
    is_enabled: true,
  })),
  graphql: {
    data: {
      repository: {
        viewerCanSeeIssueFields: true,
        viewerPermission: 'ADMIN',
        issueFields: {
          totalCount: fixture.capabilities.issueFields.values.length,
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: fixture.capabilities.issueFields.values.map((field) => ({
            id: `field-${field.id}`,
            fullDatabaseId: String(field.id),
            name: field.name,
            dataType: field.data_type.toUpperCase(),
            options: field.options,
          })),
        },
      },
    },
  },
  '/repos/acme/widgets/labels?per_page=100': fixture.capabilities.labels.values,
  '/repos/acme/widgets/issues/91': fixture.issue,
  '/repos/acme/widgets/issues/91/issue-field-values?per_page=100': [],
  '/repos/acme/widgets/issues/91/comments?per_page=100': [],
};
if (args[0] !== 'api' || !Object.hasOwn(responses, args[1])) {
  process.stderr.write(`unexpected fixture request: ${JSON.stringify(args)}\n`);
  process.exit(1);
}
const response = responses[args[1]];
process.stdout.write(JSON.stringify(args.includes('--slurp') ? [response] : response));
