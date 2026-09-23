# TracePilot — three-minute English demo script

**Total target: 2 minutes 35 seconds to 2 minutes 50 seconds.**

## 0:00–0:20 — the problem

“Engineering alerts often arrive before a team has a safe next action. The usual choices are either a vague handoff or an overpowered automation. TracePilot is a review-first agent that turns a sanitized incident signal into a small, inspectable change plan — and stops before execution.”

## 0:20–0:42 — truthful runtime boundary

“This recording uses the public static preview, which runs a deterministic offline mock. The source also includes an optional local-server path for Nebius Token Factory, but it has only been tested with fake responses. I have not made a real model call. This demo does not contact Nebius, NVIDIA infrastructure, or a repository, and it has no write access.”

## 0:42–1:15 — input and scope

“I’ll load the schema-drift sample. The run card asks for three things: an incident summary, a system boundary, and sanitized evidence. The boundary matters because the agent is not asked to solve an unlimited problem. It is asked to make a review package for one declared surface.”

**On screen:** select “Schema drift”; point to the three inputs.

## 1:15–1:52 — agent path

“Now I select Build review plan. The local agent path is visible: scope, evidence, plan, and a human gate. The output preserves the working finding, its visible citations, and three proposed checks. This makes it possible for an engineer to challenge the plan instead of trusting an opaque answer.”

**On screen:** select **Build review plan**; point to the four stages and the result panel.

## 1:52–2:25 — safety and provider contract

“The last section is the important one. In this offline run, TracePilot marks write intent as false and network intent as false. It does not create a patch, ticket, provider call, or cloud deployment. The optional local-server adapter requires a visible data-boundary confirmation before a Nebius request, but that path has not been tested with a real model. The human gate names the decision that must be made before change work starts.”

**On screen:** point to `write intent: false`, then open “Provider contract.”

## 2:25–2:45 — close

“TracePilot is an agentic-engineering pattern for turning an alert into a reviewable decision. The next step is not to claim cloud execution. It is to independently verify the competition requirements, choose a real runtime with the account holder, and demonstrate that integration truthfully.”

## Recording integrity checklist

- State the local mock boundary aloud.
- Do not display private code, credentials, personal data, or any real customer record.
- Do not show a cloud console unless it is actually configured and permissioned by the account holder.
- Do not claim model, Nebius, NVIDIA cloud deployment, award, payment, or submission evidence that is unavailable.
