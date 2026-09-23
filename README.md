# TracePilot — Local Agent Lab

**TracePilot** is a local-only, review-first engineering-agent prototype for the **Best Apps & Agents** direction of the Nebius × NVIDIA Global AI Hackathon. It is an engineering-facing productivity app, not a coding-agent track entry.

It turns **sanitized incident text** into a small, inspectable review package: a working finding, visible citations, proposed checks, and a mandatory human decision. The MVP is designed to demonstrate an agent boundary before connecting any real infrastructure. It does **not yet meet** the competition's required Nebius runtime and NVIDIA open-model use.

> **Truthful status:** this repository currently runs only a deterministic local mock. It does **not** call Nebius, NVIDIA infrastructure, a cloud model, a remote API, a repository, or any third-party service. It does not use credentials, personal data, a wallet, or payment. It does not create a remote deployment or hackathon submission.

## Product direction

Engineering teams often receive an alert before they have a safe, reviewable next action. TracePilot is a bounded incident-triage agent that makes the decision trail visible before any code, deployment, or customer data is touched.

The product demonstrates four explicit stages:

1. **Scope** — name the affected system boundary.
2. **Evidence** — retain the sanitized signal as visible input.
3. **Plan** — produce a reversible-check proposal through a provider contract.
4. **Human gate** — stop before any execution.

The primary user is an engineer or incident lead who needs a concise handoff, not an autonomous operator.

## Run locally

This project has no package install and no network dependency.

```bash
git clone https://github.com/QIU-Guanzong/tracepilot-local-agent-lab.git
cd tracepilot-local-agent-lab
python3 -m http.server 4173
```

Open [http://localhost:4173](http://localhost:4173). Use the preset sample or enter only sanitized evidence, then select **Build review plan**.

Run unit tests with the bundled or system Node runtime:

```bash
node --test
```

Use any supported local Node runtime; the test suite has no package-install step.

## Public preview

Open [TracePilot live preview](https://qiu-guanzong.github.io/tracepilot-local-agent-lab/). It runs the same deterministic local mock and does not establish a Nebius, NVIDIA, cloud, account, or deployment integration.

## Provider seam

[`src/provider.js`](src/provider.js) defines the only provider boundary:

```js
createPlan({ summary, boundary, evidence }) -> ProviderResult
```

The default `DeterministicMockProvider` has no network or write capability. A `RemoteProviderPlaceholder` intentionally rejects calls. A future account-holder-led integration can implement the same contract without changing the UI's review/human-gate behavior.

See [provider contract](docs/PROVIDER-CONTRACT.md) for the response shape and non-negotiable guardrails.

## What this MVP proves locally

- A concrete agentic-engineering workflow with input, intermediate agent path, output, and a hard human gate.
- A swappable provider contract and deterministic mock output that can be tested without credentials.
- Accessible operational UI: semantic form controls, visible focus, keyboard operation, narrow-screen layout, and `prefers-reduced-motion` support.
- Clear demo boundaries: no implication that Nebius, NVIDIA, or any cloud system has run this prototype.

## What it does **not** prove

- Any Nebius account, cloud runtime, model invocation, NVIDIA-model use, deployment, performance, or production result.
- Any access to a code repository, incident system, real customer data, credential, account, wallet, payment, or hackathon entry.
- Eligibility, acceptance, award, settlement, or revenue.

## Competition handoff

- [Competition requirement matrix](docs/COMPETITION-MATRIX.md)
- [Three-minute English demo script](docs/DEMO-SCRIPT.md)
- [Validation record](docs/VALIDATION.md)
- [MVP disclosure and next human steps](docs/DISCLOSURE.md)

The official rules require a real run on Nebius Token Factory or Nebius AI Cloud and use of at least one NVIDIA open model. Before any later cloud integration or entry, the account holder must independently verify the current official rules, eligibility, terms, privacy implications, pricing, and submission requirements.

## License

MIT. See [LICENSE](LICENSE).
