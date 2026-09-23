import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProvider,
  DeterministicMockProvider,
  ProviderKind,
  RemoteProviderPlaceholder,
  classifyScenario,
  stableTraceId,
  validateRequest
} from '../src/provider.js';

const schemaRequest = {
  summary: 'Consumer rejects renamed schema field',
  boundary: 'checkout event consumer',
  evidence: 'producer emits buyer_id, consumer expects customer_id'
};

test('validates required review-plan fields', () => {
  assert.deepEqual(validateRequest({ summary: 'x', boundary: '', evidence: '' }), {
    valid: false,
    message: 'Missing required fields: boundary, evidence.'
  });
  assert.deepEqual(validateRequest(schemaRequest), { valid: true });
});

test('chooses a bounded scenario from sanitized text', () => {
  assert.equal(classifyScenario(schemaRequest), 'schema');
  assert.equal(classifyScenario({ ...schemaRequest, summary: 'Role access denied' }), 'permissions');
  assert.equal(classifyScenario({ ...schemaRequest, evidence: 'p95 latency budget is exceeded' }), 'latency');
});

test('returns deterministic, review-only mock output with visible guardrails', async () => {
  const provider = new DeterministicMockProvider();
  const first = await provider.createPlan(schemaRequest);
  const second = await provider.createPlan(schemaRequest);
  assert.equal(first.provider, 'LOCAL-MOCK/0.1');
  assert.equal(first.mode, 'review-only');
  assert.equal(first.writeIntent, false);
  assert.equal(first.networkIntent, false);
  assert.equal(first.traceId, stableTraceId(schemaRequest));
  assert.deepEqual(first, second);
  assert.equal(first.citations.at(-1), 'boundary: checkout event consumer');
  assert.equal(first.proposedChecks.length, 3);
});

test('provider factory makes local mock default and remote adapter refuses to run', async () => {
  assert.equal(createProvider().kind, ProviderKind.LOCAL_MOCK);
  assert.equal(createProvider(ProviderKind.REMOTE_PLACEHOLDER).kind, ProviderKind.REMOTE_PLACEHOLDER);
  await assert.rejects(new RemoteProviderPlaceholder().createPlan(schemaRequest), /intentionally disabled/);
});

test('rejects oversized evidence before any plan exists', async () => {
  const provider = new DeterministicMockProvider();
  await assert.rejects(provider.createPlan({ ...schemaRequest, evidence: 'a'.repeat(801) }), /800 characters/);
});
