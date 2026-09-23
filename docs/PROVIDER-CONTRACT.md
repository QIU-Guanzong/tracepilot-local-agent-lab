# Provider contract

TracePilot's provider boundary deliberately models **planning**, not autonomous execution.

```ts
type PlanRequest = {
  summary: string; // maximum 120 characters
  boundary: string; // maximum 80 characters
  evidence: string; // sanitized text, maximum 800 characters
};

type ProviderResult = {
  provider: string;
  traceId: string;
  scenario: 'schema' | 'permissions' | 'latency';
  mode: 'review-only' | 'model-review-only';
  finding: string;
  citations: string[];
  proposedChecks: string[];
  humanDecision: string;
  writeIntent: false;
  networkIntent: boolean;
  model?: string;
  generatedAt?: string;
  tokenUsage?: { input: number; output: number; total: number } | null;
};
```

## Current adapter

`DeterministicMockProvider` is the default adapter. It uses small, stable local templates chosen from the sanitized input. It has no transport code, no remote endpoint, and no write operation.

`NebiusTokenFactoryProxyProvider` is available only from the local Node server when a server-side key is configured. It sends a same-origin `POST /api/plan`; browser code never receives the key. The server forwards only the three bounded text fields to the OpenAI-compatible Token Factory chat endpoint with `nvidia/Nemotron-3_5-Lightning`, then validates the model's constrained JSON before returning a review-only result. The request is never written to disk or logged by the app. Each server process accepts at most three provider requests.

The adapter's implementation and fake-fetch tests are not proof of a live Nebius or NVIDIA run. Static hosting always serves `src/runtime-config.js` with the remote provider disabled. `RemoteProviderPlaceholder` remains as a compatibility seam and rejects calls.

## Integration requirements for a future real provider

Any future implementation must preserve these product constraints:

1. Do not send credentials, private code, personal data, customer data, or secrets by default.
2. Show the provider, model/runtime identifier, time, input scope, and response source in the review package.
3. Keep an explicit human gate before repository writes, deployment, ticket creation, notifications, or any external action.
4. Make network and write intent explicit and opt-in. A successful model response is never permission to execute.
5. Fail closed if authentication, policy checks, cost boundaries, or data classification are unavailable.

Those requirements are product design constraints. A real model request may incur usage charges even if the output is rejected; the app makes no live provider call without an explicitly configured key and a per-request UI confirmation.
