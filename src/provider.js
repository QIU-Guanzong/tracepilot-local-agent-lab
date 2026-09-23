/**
 * The provider seam is deliberately narrow: UI code receives a structured,
 * review-only result and never receives transport, credentials, or write access.
 */
export const ProviderKind = Object.freeze({
  LOCAL_MOCK: 'local-mock',
  REMOTE_PLACEHOLDER: 'remote-placeholder'
});

const PLANS = {
  schema: {
    finding: 'The signal is consistent with a contract field changing before its consumer was updated.',
    citations: ['sanitized incident evidence', 'declared service boundary'],
    checks: ['Compare producer and consumer schema versions.', 'Add a backward-compatible parser test.', 'Verify the release path with a fixture, not production data.'],
    decision: 'Confirm the expected contract owner before opening a change.'
  },
  permissions: {
    finding: 'The signal points to a permission check that no longer matches the documented access path.',
    citations: ['sanitized incident evidence', 'declared system boundary'],
    checks: ['Map the request path and authorization decision.', 'Add a least-privilege regression fixture.', 'Ask the owning team to approve the intended policy.'],
    decision: 'Confirm the intended permission policy before proposing a patch.'
  },
  latency: {
    finding: 'The signal is consistent with a release that exceeds its latency budget under a bounded workload.',
    citations: ['sanitized incident evidence', 'declared performance boundary'],
    checks: ['Fix the benchmark input and threshold.', 'Compare one reversible change at a time.', 'Require an owner to approve any rollout decision.'],
    decision: 'Confirm the budget and production guardrails before any implementation work.'
  }
};

export function classifyScenario(input) {
  const text = `${input.summary} ${input.boundary} ${input.evidence}`.toLowerCase();
  if (/permission|authori[sz]|access|role/.test(text)) return 'permissions';
  if (/latency|slow|timeout|p95|budget/.test(text)) return 'latency';
  return 'schema';
}

export function validateRequest(input) {
  const fields = ['summary', 'boundary', 'evidence'];
  const missing = fields.filter((field) => !String(input?.[field] ?? '').trim());
  if (missing.length) {
    return { valid: false, message: `Missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.` };
  }
  if (String(input.evidence).length > 800) {
    return { valid: false, message: 'Evidence must be 800 characters or fewer.' };
  }
  return { valid: true };
}

export function stableTraceId(input) {
  const source = `${input.summary}|${input.boundary}|${input.evidence}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `local-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export class DeterministicMockProvider {
  constructor() {
    this.kind = ProviderKind.LOCAL_MOCK;
  }

  async createPlan(input) {
    const validation = validateRequest(input);
    if (!validation.valid) throw new Error(validation.message);
    const scenario = classifyScenario(input);
    const template = PLANS[scenario];
    return {
      provider: 'LOCAL-MOCK/0.1',
      traceId: stableTraceId(input),
      scenario,
      mode: 'review-only',
      finding: template.finding,
      citations: [...template.citations, `boundary: ${input.boundary}`],
      proposedChecks: template.checks,
      humanDecision: template.decision,
      writeIntent: false,
      networkIntent: false
    };
  }
}

export class RemoteProviderPlaceholder {
  constructor() {
    this.kind = ProviderKind.REMOTE_PLACEHOLDER;
  }

  async createPlan() {
    throw new Error('Remote providers are intentionally disabled in this local MVP.');
  }
}

export function createProvider(kind = ProviderKind.LOCAL_MOCK) {
  if (kind === ProviderKind.LOCAL_MOCK) return new DeterministicMockProvider();
  if (kind === ProviderKind.REMOTE_PLACEHOLDER) return new RemoteProviderPlaceholder();
  throw new Error(`Unknown provider kind: ${kind}`);
}
