# Provider contract

TracePilot's provider boundary deliberately models **planning**, not autonomous execution.

```ts
type PlanRequest = {
  summary: string;
  boundary: string;
  evidence: string; // sanitized text, maximum 800 characters
};

type ProviderResult = {
  provider: string;
  traceId: string;
  scenario: 'schema' | 'permissions' | 'latency';
  mode: 'review-only';
  finding: string;
  citations: string[];
  proposedChecks: string[];
  humanDecision: string;
  writeIntent: false;
  networkIntent: false;
};
```

## Current adapter

`DeterministicMockProvider` is the default adapter. It uses small, stable local templates chosen from the sanitized input. It has no transport code, no remote endpoint, and no write operation.

`RemoteProviderPlaceholder` exists to make the future seam explicit, but it always rejects with an intentional boundary error. It must not be presented as a configured Nebius or NVIDIA provider.

## Integration requirements for a future real provider

Any future implementation must preserve these product constraints:

1. Do not send credentials, private code, personal data, customer data, or secrets by default.
2. Show the provider, model/runtime identifier, time, input scope, and response source in the review package.
3. Keep an explicit human gate before repository writes, deployment, ticket creation, notifications, or any external action.
4. Make network and write intent explicit and opt-in. A successful model response is never permission to execute.
5. Fail closed if authentication, policy checks, cost boundaries, or data classification are unavailable.

Those requirements are product design constraints, not evidence that a future provider has been integrated.
