# Disclosure and next human steps

## Current state

The public static preview and the local server without a key use a **deterministic offline mock**. The source also contains an optional, server-side Nebius Token Factory adapter. That adapter has been validated only with fake responses; no real Nebius, NVIDIA, or cloud-model run has occurred.

It has not:

- created or signed into a Nebius, Devpost, NVIDIA, or other new provider account;
- accepted terms, made a purchase, activated billing, used a payment method, or handled a wallet;
- transmitted private code, customer data, personal data, credentials, tokens, or secrets;
- configured a Nebius or AI Cloud runtime, called an external model, recorded/uploaded a video, or submitted to a competition.

The source and static preview are publicly published. GitHub Pages remains offline-only. A local Node server can expose the opt-in provider selector only when the account holder configures a server-side key; each request also requires a visible data-boundary confirmation. Do not use unsanitized or unauthorized text.

## Minimum human gates before a real integration

1. Review the current official rules, eligibility, technology requirements, terms, privacy policy, costs, and deadlines.
2. Decide whether a real provider is appropriate and whether the data sent to it is safe and authorized.
3. Create/configure any account, billing, API credential, or cloud service personally and only after reviewing the associated terms and costs.
4. If approved, place the key only in a local ignored `.env` file or server environment, then make a deliberate, sanitized test request and inspect the result and provider usage.
5. Verify the deployed behavior with real evidence, then record a truthful demo.
6. Review the final content, license/IP posture, and complete any identity, tax, payout, or submission steps personally through the official platform.

None of those actions have been taken by this MVP.
