import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNebiusPlanProvider,
  DEFAULT_MODEL,
  parseModelContent,
  TOKEN_FACTORY_CHAT_URL
} from '../server/nebius-provider.js';

const request = {
  summary: 'Consumer rejects renamed schema field',
  boundary: 'checkout event consumer',
  evidence: 'producer emits buyer_id, consumer expects customer_id'
};

const modelPlan = {
  scenario: 'schema',
  finding: 'The producer and consumer appear to disagree on the event field name.',
  proposedChecks: ['Compare the producer and consumer schemas.', 'Add a compatibility fixture.'],
  humanDecision: 'Ask the owning team to confirm the intended event contract.'
};

function okPayload(plan = modelPlan) {
  return {
    choices: [{ message: { content: JSON.stringify(plan) } }],
    usage: { prompt_tokens: 34, completion_tokens: 42, total_tokens: 76 }
  };
}

test('requires a key and an NVIDIA model before any fetch', () => {
  assert.throws(() => createNebiusPlanProvider({ apiKey: '  ' }), /NEBIUS_API_KEY/);
  assert.throws(() => createNebiusPlanProvider({ apiKey: 'test-key', model: 'provider/not-nvidia' }), /NVIDIA model/);
});

test('sends a bounded review request and returns source-labelled model output', async () => {
  let call;
  const provider = createNebiusPlanProvider({
    apiKey: ' test-only-key ',
    fetchImpl: async (url, options) => {
      call = { url, options };
      return new Response(JSON.stringify(okPayload()), { status: 200 });
    }
  });
  const result = await provider.createPlan(request);

  assert.equal(call.url, TOKEN_FACTORY_CHAT_URL);
  assert.equal(call.options.method, 'POST');
  assert.equal(call.options.headers.Authorization, 'Bearer test-only-key');
  const body = JSON.parse(call.options.body);
  assert.equal(body.model, DEFAULT_MODEL);
  assert.equal(body.max_tokens, 700);
  assert.deepEqual(JSON.parse(body.messages[1].content), request);
  assert.equal(result.mode, 'model-review-only');
  assert.equal(result.writeIntent, false);
  assert.equal(result.networkIntent, true);
  assert.deepEqual(result.tokenUsage, { input: 34, output: 42, total: 76 });
  assert.deepEqual(result.citations, [
    'User-provided incident summary',
    'User-declared system boundary',
    'User-provided sanitized evidence'
  ]);
});

test('rejects oversized input before calling the upstream service', async () => {
  let calls = 0;
  const provider = createNebiusPlanProvider({
    apiKey: 'test-only-key',
    fetchImpl: async () => { calls += 1; }
  });
  await assert.rejects(provider.createPlan({ ...request, summary: 's'.repeat(121) }), /Summary must be 120/);
  assert.equal(calls, 0);
});

test('rejects malformed and unsafe model output', () => {
  assert.throws(() => parseModelContent('not json'), /not valid JSON/);
  assert.throws(() => parseModelContent(JSON.stringify({ ...modelPlan, scenario: 'execute' })), /did not match/);
  assert.throws(() => parseModelContent(JSON.stringify({ ...modelPlan, proposedChecks: [] })), /did not match/);
  assert.throws(() => parseModelContent(JSON.stringify({ ...modelPlan, humanDecision: 'x'.repeat(301) })), /did not match/);
});

test('does not forward upstream response bodies or credentials in errors', async () => {
  const provider = createNebiusPlanProvider({
    apiKey: 'private-test-key',
    fetchImpl: async () => new Response('private-test-key upstream details', { status: 429 })
  });
  await assert.rejects(provider.createPlan(request), (error) => {
    assert.match(error.message, /HTTP 429/);
    assert.doesNotMatch(error.message, /private-test-key|upstream details/);
    return true;
  });
});

test('maps transport failures and timeouts to safe messages', async () => {
  const unavailable = createNebiusPlanProvider({
    apiKey: 'test-key',
    fetchImpl: async () => { throw new Error('secret upstream detail'); }
  });
  await assert.rejects(unavailable.createPlan(request), /could not be reached/);

  const timeout = createNebiusPlanProvider({
    apiKey: 'test-key',
    timeoutMs: 10,
    fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
    })
  });
  await assert.rejects(timeout.createPlan(request), /timed out/);
});
