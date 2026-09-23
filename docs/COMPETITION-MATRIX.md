# Competition requirement matrix — local preflight

This is a planning matrix for the public **Nebius × NVIDIA Global AI Hackathon** materials, checked on 2026-09-23. TracePilot is deliberately scoped for **Best Apps & Agents**: an engineering-team productivity application that creates a reviewable incident handoff. It is not a Coding & Agentic Engineering track entry.

This document is not a submission checklist and does not assert eligibility. Re-check the current [official rules](https://nebiusglobalaihackathon.devpost.com/rules), [event page](https://nebiusglobalaihackathon.devpost.com/), and [judging explanation](https://nebiusglobalaihackathon.devpost.com/updates/46204-here-s-how-judging-works) immediately before any account, cloud, or submission action.

| Official requirement / evaluation expectation | TracePilot local evidence | Current state | Human-only next threshold |
| --- | --- | --- | --- |
| A suitable **Best Apps & Agents** project: a useful application or agent for real users | Product definition and interactive incident-review workflow in this repository | Locally reviewable concept | Confirm track fit against the current official wording |
| Every entry must run on **Nebius Token Factory** or **Nebius AI Cloud** | Local server adapter targets Token Factory's chat endpoint | **Not met.** Adapter has only fake-response tests; no real Nebius account, call, endpoint session, job, or cloud runtime exists | Account holder must review access, terms, pricing, privacy, and configure a real runtime personally |
| Every entry must use at least one **NVIDIA open model** | Optional local selector defaults to `nvidia/Nemotron-3_5-Lightning` when server-side configuration exists | **Not met.** No model has been invoked or evaluated | Verify current model availability, make an authorized call, and keep its receipt/runtime evidence |
| Working demo / hosted application or test build | Offline browser app plus tested local Node server and same-origin provider proxy | Public static preview remains deterministic mock; optional runtime has not been configured | Validate an actual integrated runtime before making any cloud-runtime claim |
| Public source repository with complete source, assets, run instructions, and a visible open-source license | Source tree, `README.md`, and MIT `LICENSE` | Public source is available at https://github.com/QIU-Guanzong/tracepilot-local-agent-lab | Re-check IP/license posture before any later third-party integration |
| English functionality/implementation explanation | `README.md`, `docs/PROVIDER-CONTRACT.md`, `docs/DISCLOSURE.md` | Public English materials cover both the offline mock and the unrun optional adapter | Update claims only after real integration evidence exists |
| Public YouTube demo of no more than three minutes, showing actual operation and explaining Nebius / NVIDIA use | `docs/DEMO-SCRIPT.md` | Script only; no video exists | Record and publish a truthful video only after the claimed runtime is actually verified |
| Feedback on Nebius Token Factory, AI Cloud, and NVIDIA tools/models | No feedback prepared from actual use | Not started | Use services lawfully and personally, then provide factual feedback if the submission form asks for it |
| Free review access during judging | None | Not available | Independently choose and maintain an appropriate, secure review path |
| Original work/IP authorization; disclose substantial work in submission period for older work | This local artifact is created as a new preflight MVP | Local evidence only | Account holder must verify authorship, dependency licenses, and any disclosure requirements |
| Submit in English during the official window | No platform interaction | Not submitted | Account holder must log in, review current rules/terms, and submit personally |

## Track-specific interpretation

- **Best Apps & Agents:** Serverless Endpoints or Jobs are encouraged but the public materials do not make them a separate hard requirement. The essential requirement remains a real Nebius runtime plus at least one NVIDIA open model.
- **Coding & Agentic Engineering:** its public description emphasizes coding agents that write, run, and test code in Token Factory Sandboxes. TracePilot intentionally does not claim that track because its current product stops before code changes.

## Submission and prize facts to re-check

The public materials state a submission window of **2026-08-26 09:00 PT to 2026-10-30 10:00 PDT** (approximately **2026-10-31 01:00 HKT** at close), a public source/review-access requirement, English materials, and a public YouTube demo under three minutes. Award, eligibility, payment, tax, form, delivery, country availability, and technology requirements must be checked in the then-current official rules; they are not promised by this MVP.

The public rules describe a cash overall pool (listed as $20,000 / $10,000 / $6,000 for the top three) and a $3,000 Tavily bonus that requires an actual Tavily API call. Best Apps & Agents itself is listed with a Jetson Orin Nano track prize, not a cash promise. Any award remains conditional on judging, eligibility, forms, verification, and the official rules.

## Source boundary

The project uses public event material only as planning reference. This local artifact does not establish eligibility, accepted technology use, account access, award, settlement, income, or shipment. An administrator comment says a Token Factory NVIDIA-model call can satisfy the Nebius runtime requirement and that Serverless is not mandatory for Apps & Agents; it is useful context, not a substitute for the official rules: [administrator clarification](https://nebiusglobalaihackathon.devpost.com/forum_topics/45163-does-calling-an-nvidia-model-via-token-factory-satisfy-the-must-run-on-nebius-requirement).
