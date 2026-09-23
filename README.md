# TracePilot — Local Agent Lab

**TracePilot** is a review-first incident-planning app prepared for the **Best Apps & Agents** direction of the Nebius × NVIDIA Global AI Hackathon. It turns a bounded, sanitized incident report into an inspectable handoff and stops before any code or infrastructure action.

It turns **sanitized incident text** into a small, inspectable review package: a working finding, visible source labels, proposed checks, and a mandatory human decision. The repository now contains an optional server-side Nebius Token Factory adapter for `nvidia/Nemotron-3_5-Lightning`. It is disabled without a server-side key and requires a per-request confirmation in the local UI.

> **Truthful status:** the public GitHub Pages preview remains a deterministic offline mock. The new optional adapter has only been tested with fake responses; there has been no real Nebius/NVIDIA model call, account setup, cloud deployment, or hackathon submission.

## Product direction

Engineering teams often receive an alert before they have a safe, reviewable next action. TracePilot is a bounded incident-triage agent that makes the decision trail visible before any code, deployment, or customer data is touched.

The product demonstrates four explicit stages:

1. **Scope** — name the affected system boundary.
2. **Evidence** — retain the sanitized signal as visible input.
3. **Plan** — produce a reversible-check proposal through a provider contract.
4. **Human gate** — stop before any execution.

The primary user is an engineer or incident lead who needs a concise handoff, not an autonomous operator.

## Run locally

No package install is needed. Start the local server in offline mode:

```bash
git clone https://github.com/QIU-Guanzong/tracepilot-local-agent-lab.git
cd tracepilot-local-agent-lab
npm run serve
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Use a preset or enter sanitized evidence, then select **Build review plan**. Without a key, the page stays offline and uses the deterministic mock.

Run the provider, proxy, input-boundary, and HTTP-server tests with Node:

```bash
node --test
```

The tests use only Node's built-in test runner and fake upstream responses; they never call the internet. Node 20.6 or later is required for the optional `--env-file` startup command.

### Optional real model path

Only enable this after the account holder has reviewed current provider terms, data handling, and usage prices and has configured a key personally. Keep the key in a local ignored `.env` file or server environment; never put it in source, browser storage, or a commit. An empty template is available at `.env.example`.

```bash
node --env-file=.env server.js
```

The local page then offers **Nebius Token Factory · NVIDIA Nemotron**. Selecting it, confirming the data notice, and building a plan sends the three input fields to the server, which makes one request to Nebius. The server allows at most three requests per run and caps the generated response; it does not log the request body. A failed response can still have incurred provider usage. The static GitHub Pages preview never exposes this option or makes a provider request.

## Public preview

Open [TracePilot live preview](https://qiu-guanzong.github.io/tracepilot-local-agent-lab/). It runs the same deterministic local mock and does not establish a Nebius, NVIDIA, cloud-runtime, or account integration.

## Provider seam

[`src/provider.js`](src/provider.js) defines the only provider boundary:

```js
createPlan({ summary, boundary, evidence }) -> ProviderResult
```

The default `DeterministicMockProvider` has no network or write capability. The optional `NebiusTokenFactoryProxyProvider` sends a same-origin request to the local Node server; the server keeps the key out of the browser and accepts only bounded text. A human confirmation is required for every model request. The adapter has no repository, execution, or write tools. `RemoteProviderPlaceholder` remains only as a compatibility seam and intentionally rejects calls.

See [provider contract](docs/PROVIDER-CONTRACT.md) for the response shape and non-negotiable guardrails.

## What this MVP proves locally

- A concrete agentic-engineering workflow with input, intermediate agent path, output, and a hard human gate.
- A server-side NVIDIA-model adapter, same-origin proxy, bounded request count, and deterministic fallback; tested entirely with fake fetch responses.
- Accessible operational UI: semantic form controls, visible focus, keyboard operation, narrow-screen layout, and `prefers-reduced-motion` support.
- Clear demo boundaries: no implication that Nebius, NVIDIA, or any cloud system has run this prototype.

## What it does **not** prove

- Any live Nebius account, cloud runtime, model invocation, NVIDIA-model use, cloud deployment, performance, or production result.
- Any access to a code repository, incident system, real customer data, credential, account, wallet, payment, or hackathon entry.
- Eligibility, acceptance, award, settlement, or revenue.

## Competition handoff

- [Competition requirement matrix](docs/COMPETITION-MATRIX.md)
- [Three-minute English demo script](docs/DEMO-SCRIPT.md)
- [Validation record](docs/VALIDATION.md)
- [MVP disclosure and next human steps](docs/DISCLOSURE.md)

The official rules require a real run on Nebius Token Factory or Nebius AI Cloud and use of at least one NVIDIA open model. This source implementation alone does not satisfy that requirement; a real authorized model run, truthful demo, eligibility check, and final entry are still outstanding.

## License

MIT. See [LICENSE](LICENSE).
