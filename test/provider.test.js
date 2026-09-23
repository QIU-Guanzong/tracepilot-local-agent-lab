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

test('enforces the same input bounds for every provider', () => {
  assert.match(validateRequest({ ...schemaRequest, summary: 's'.repeat(121) }).message, /Summary must be 120/);
  assert.match(validateRequest({ ...schemaRequest, boundary: 'b'.repeat(81) }).message, /Boundary must be 80/);
  assert.match(validateRequest({ ...schemaRequest, evidence: 'e'.repeat(801) }).message, /Evidence must be 800/);
  assert.match(validateRequest({ ...schemaRequest, summary: 12 }).message, /summary/);
});

test('Nebius browser proxy is disabled without configuration and stays same-origin', async () => {
  let requests = 0;
  const disabled = createProvider(ProviderKind.NEBIUS_TOKEN_FACTORY, {
    fetchImpl: async () => { requests += 1; },
    enabled: false
  });
  await assert.rejects(disabled.createPlan(schemaRequest), /local server with a server-side API key/);
  assert.equal(requests, 0);

  let outgoing;
  const enabled = createProvider(ProviderKind.NEBIUS_TOKEN_FACTORY, {
    enabled: true,
    fetchImpl: async function (url, options) {
      assert.equal(this, globalThis);
      outgoing = { url, options };
      return new Response(JSON.stringify({
        provider: 'NEBIUS TOKEN FACTORY',
        traceId: 'local-12345678',
        scenario: 'schema',
        mode: 'model-review-only',
        finding: 'A cautious finding.',
        citations: ['User-provided evidence'],
        proposedChecks: ['Compare the two schemas.'],
        humanDecision: 'Have the owner review the compatibility boundary.',
        writeIntent: false,
        networkIntent: true
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  });
  const result = await enabled.createPlan(schemaRequest);
  assert.equal(outgoing.url, '/api/plan');
  assert.equal(outgoing.options.method, 'POST');
  assert.equal(outgoing.options.headers.Authorization, undefined);
  assert.deepEqual(JSON.parse(outgoing.options.body), schemaRequest);
  assert.equal(result.networkIntent, true);
  assert.equal(result.writeIntent, false);
});

test('Nebius browser proxy rejects responses that break the review-only contract', async () => {
  const provider = createProvider(ProviderKind.NEBIUS_TOKEN_FACTORY, {
    enabled: true,
    fetchImpl: async () => new Response(JSON.stringify({ mode: 'autonomous', writeIntent: true, networkIntent: true }), { status: 200 })
  });
  await assert.rejects(provider.createPlan(schemaRequest), /did not satisfy the review-only contract/);
});
