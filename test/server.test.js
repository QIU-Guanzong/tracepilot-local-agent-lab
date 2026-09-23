import test from 'node:test';
import assert from 'node:assert/strict';
import { createTracePilotServer } from '../server.js';
import { DEFAULT_MODEL, TOKEN_FACTORY_CHAT_URL } from '../server/nebius-provider.js';

const request = {
  summary: 'Consumer rejects renamed schema field',
  boundary: 'checkout event consumer',
  evidence: 'producer emits buyer_id, consumer expects customer_id'
};

const responsePlan = {
  scenario: 'schema',
  finding: 'The producer and consumer appear to disagree on the event field name.',
  proposedChecks: ['Compare the two schemas.'],
  humanDecision: 'Have the owner confirm the event contract.'
};

async function withServer(options, callback) {
  const server = createTracePilotServer(options);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  const origin = `http://127.0.0.1:${port}`;
  try {
    await callback(origin);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function fakeFetch(counter) {
  return async (url, options) => {
    counter.calls += 1;
    counter.url = url;
    counter.options = options;
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(responsePlan) } }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
    }), { status: 200 });
  };
}

test('serves offline config without a key and does not call an upstream provider', async () => {
  const counter = { calls: 0 };
  await withServer({ fetchImpl: fakeFetch(counter) }, async (origin) => {
    const configResponse = await fetch(`${origin}/src/runtime-config.js`);
    const config = await configResponse.text();
    assert.equal(configResponse.status, 200);
    assert.match(config, /"remoteProviderEnabled":false/);
    assert.doesNotMatch(config, /NEBIUS_API_KEY|Bearer|test-key/);

    const response = await fetch(`${origin}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify(request)
    });
    assert.equal(response.status, 503);
    assert.equal(counter.calls, 0);
  });
});

test('serves the local app and protects the runtime key from browser config', async () => {
  const counter = { calls: 0 };
  await withServer({ apiKey: 'server-only-test-secret', fetchImpl: fakeFetch(counter) }, async (origin) => {
    const page = await fetch(origin);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /TracePilot/);
    const configResponse = await fetch(`${origin}/src/runtime-config.js`);
    const config = await configResponse.text();
    assert.match(config, /"remoteProviderEnabled":true/);
    assert.match(config, new RegExp(DEFAULT_MODEL.replaceAll('/', '\\/')));
    assert.doesNotMatch(config, /server-only-test-secret|Authorization|Bearer/);
    assert.equal(counter.calls, 0);
  });
});

test('sends only same-origin valid requests through the server-side provider', async () => {
  const counter = { calls: 0 };
  await withServer({ apiKey: 'server-only-test-secret', fetchImpl: fakeFetch(counter), maxProviderCalls: 1 }, async (origin) => {
    const crossOrigin = await fetch(`${origin}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://example.invalid' },
      body: JSON.stringify(request)
    });
    assert.equal(crossOrigin.status, 403);
    assert.equal(counter.calls, 0);

    const invalid = await fetch(`${origin}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify({ ...request, summary: 's'.repeat(121) })
    });
    assert.equal(invalid.status, 400);
    assert.equal(counter.calls, 0);

    const response = await fetch(`${origin}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify(request)
    });
    const plan = await response.json();
    assert.equal(response.status, 200);
    assert.equal(plan.mode, 'model-review-only');
    assert.equal(plan.writeIntent, false);
    assert.equal(plan.networkIntent, true);
    assert.equal(plan.requestsRemaining, 0);
    assert.equal(counter.calls, 1);
    assert.equal(counter.url, TOKEN_FACTORY_CHAT_URL);
    assert.equal(counter.options.headers.Authorization, 'Bearer server-only-test-secret');
    assert.equal(JSON.parse(counter.options.body).model, DEFAULT_MODEL);

    const limited = await fetch(`${origin}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify(request)
    });
    assert.equal(limited.status, 429);
    assert.equal(counter.calls, 1);
  });
});

test('rejects oversized request bodies and unsupported methods before provider use', async () => {
  const counter = { calls: 0 };
  await withServer({ apiKey: 'server-only-test-secret', fetchImpl: fakeFetch(counter) }, async (origin) => {
    const oversized = await fetch(`${origin}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: 'x'.repeat(10_001)
    });
    assert.equal(oversized.status, 413);
    const wrongMethod = await fetch(`${origin}/api/plan`, { method: 'GET' });
    assert.equal(wrongMethod.status, 405);
    const wrongType = await fetch(`${origin}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', Origin: origin },
      body: 'not json'
    });
    assert.equal(wrongType.status, 415);
    assert.equal(counter.calls, 0);
  });
});
