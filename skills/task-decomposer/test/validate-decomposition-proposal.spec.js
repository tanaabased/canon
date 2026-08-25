import assert from 'node:assert/strict';

import { inspectTaskDecompositionEvidence } from '../lib/task-decomposition-inspector.js';
import evaluateDecompositionThreshold from '../utils/evaluate-decomposition-threshold.js';
import validateDecompositionProposal from '../utils/validate-decomposition-proposal.js';
import { fakeGitHubTaskDecomposerClient } from './fake-github-task-decomposer-client.js';
import {
  decompositionProposal,
  milestoneReframingProposal,
  parentAcceptanceCriteria,
  parentFields,
  parentIssue,
} from './task-decomposition-fixtures.js';

function evidence(options = {}) {
  return inspectTaskDecompositionEvidence(
    'acme/widgets#1',
    fakeGitHubTaskDecomposerClient({
      issues: [parentIssue(), ...(options.issues ?? [])],
      fields: { 1: parentFields(options.workSize ?? 21) },
      parents: options.parents,
    }),
  );
}

describe('Task Decomposer recommendation and graph validation', () => {
  it('should apply the shared Work size review thresholds without authorizing writes', () => {
    assert.deepEqual(evaluateDecompositionThreshold(13), {
      workSize: 13,
      suggestedDecision: null,
      explicitReviewRequired: true,
      rationale: 'Work size 13 requires an explicit keep-or-decompose review.',
    });
    assert.equal(evaluateDecompositionThreshold(21).suggestedDecision, 'decompose');
    assert.equal(evaluateDecompositionThreshold(8).suggestedDecision, 'keep_intact');
  });

  it('should return a valid explicit keep-intact recommendation with no mutation graph', () => {
    const proposal = {
      recommendation: {
        decision: 'keep_intact',
        rationale: ['The outcome remains independently completable.'],
        explicitReviewAcknowledged: true,
      },
      children: [],
      dependencies: [],
    };

    const report = validateDecompositionProposal(proposal, evidence({ workSize: 13 }));

    assert.equal(report.decision, 'keep_intact');
    assert.deepEqual(report.errors, []);
  });

  it('should accept complete non-overlapping coverage and an acyclic necessary dependency', () => {
    const report = validateDecompositionProposal(decompositionProposal(), evidence());

    assert.equal(report.decision, 'decompose');
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.findings.gaps, []);
    assert.deepEqual(report.findings.overlaps, []);
  });

  it('should accept one complete milestone-reframing handoff with non-size evidence', () => {
    const report = validateDecompositionProposal(milestoneReframingProposal(), evidence());

    assert.equal(report.decision, 'reframe_as_milestone');
    assert.deepEqual(report.errors, []);
    assert.equal(report.milestoneHandoff.sourceTask.target, 'acme/widgets#1');
    assert.equal(report.milestoneHandoff.sourceTaskDisposition.status, 'decision_required');
    assert.equal(
      report.milestoneHandoff.routing.projectMilestonePlanner.status,
      'blocked_until_exact_milestone',
    );
  });

  it('should reject Work-size-only milestone classification and unresolved cases', () => {
    const workSizeOnly = milestoneReframingProposal();
    workSizeOnly.recommendation.classificationEvidence = [
      { signal: 'work_size', evidence: 'The observed Work size is 21.' },
    ];
    workSizeOnly.recommendation.classificationUncertainties = [
      'The source may still be one bounded executable task.',
    ];

    const report = validateDecompositionProposal(workSizeOnly, evidence());

    assert.ok(report.errors.some((error) => error.includes('Work size alone')));
    assert.ok(report.errors.some((error) => error.includes('remains unresolved')));
  });

  it('should reject an incomplete milestone handoff and source-constraint loss', () => {
    const proposal = milestoneReframingProposal();
    proposal.milestoneHandoff.proposedMilestone.outcome = '';
    proposal.milestoneHandoff.proposedMilestone.completionConditions = [];
    proposal.milestoneHandoff.proposedMilestone.constraints = [];
    delete proposal.milestoneHandoff.proposedMilestone.openQuestions;
    delete proposal.recommendation.classificationUncertainties;

    const report = validateDecompositionProposal(proposal, evidence());

    assert.ok(report.errors.some((error) => error.includes('requires an outcome')));
    assert.ok(report.errors.some((error) => error.includes('completion conditions')));
    assert.ok(report.errors.some((error) => error.includes('source-task constraint')));
    assert.ok(report.errors.some((error) => error.includes('openQuestions')));
    assert.ok(report.errors.some((error) => error.includes('classificationUncertainties')));
  });

  it('should reject publication or task-graph surfaces on a milestone reframe', () => {
    const proposal = milestoneReframingProposal({
      children: decompositionProposal().children,
      publication: { safetyReviewed: true },
    });

    const report = validateDecompositionProposal(proposal, evidence());

    assert.ok(report.errors.some((error) => error.includes('cannot contain child')));
    assert.ok(report.errors.some((error) => error.includes('publication approval')));
  });

  it('should identify coverage gaps, overlaps, duplicate criteria, and dependency cycles', () => {
    const proposal = decompositionProposal();
    proposal.children[0].covers = [...parentAcceptanceCriteria];
    proposal.children[1].covers = [parentAcceptanceCriteria[1]];
    proposal.children[1].task.sections.acceptanceCriteria = [
      proposal.children[0].task.sections.acceptanceCriteria[0],
    ];
    proposal.dependencies.push({
      blocked: 'inspection',
      blockedBy: 'publication',
      reason: 'Invalid reverse ordering.',
    });

    const report = validateDecompositionProposal(proposal, evidence());

    assert.ok(report.findings.overlaps.length > 0);
    assert.ok(report.findings.duplicateCriteria.length > 0);
    assert.ok(report.errors.some((error) => error.includes('cycle')));
  });

  it('should reject a parent that is already nested beneath another task', () => {
    const outer = parentIssue({ id: 10_009, number: 9, title: 'Outer parent' });
    const report = validateDecompositionProposal(
      decompositionProposal(),
      evidence({ issues: [outer], parents: { 1: 9 } }),
    );

    assert.ok(report.errors.some((error) => error.includes('depth two')));
  });

  it('should keep assignee, milestone, and relationship writes outside child payloads', () => {
    const proposal = decompositionProposal();
    proposal.children[0].reuseIssueNumber = 'not-a-number';
    proposal.children[0].task.relationships = { blockedBy: true };
    proposal.children[0].task.assignees = ['octocat'];
    proposal.children[0].task.milestone = 4;

    const report = validateDecompositionProposal(proposal, evidence());

    assert.ok(report.errors.some((error) => error.includes('positive issue number')));
    assert.ok(report.errors.some((error) => error.includes('decomposition graph')));
    assert.ok(report.errors.some((error) => error.includes('assignee or milestone')));
  });

  it('should verify shared constraints in canonical rendered child sections', () => {
    const proposal = decompositionProposal();
    delete proposal.children[0].task.sections.constraints;

    const report = validateDecompositionProposal(proposal, evidence());

    assert.ok(report.errors.some((error) => error.includes('does not render')));
  });
});
