# Local validation record

Checked on 2026-09-23 against the **local deterministic mock** only. These results do not establish Nebius, NVIDIA, cloud-model, eligibility, competition, payment, or submission outcomes.

| Check | Evidence | Result |
| --- | --- | --- |
| Provider contract unit tests | Bundled Node: `node --test` | Passed — 5 tests cover validation, deterministic output, scenario selection, default local mock, disabled remote placeholder, and evidence limit |
| Diff hygiene | `git diff --check` | Passed — no whitespace errors before local commit |
| Static browser load | System Chrome via local server, 1440×1024 | Passed — title and initial controls rendered; console errors: 0; requests stayed local-only |
| Public static preview | GitHub Pages deployment 35813560905 at the documented public URL | Passed — public page and review-plan flow were read back after deployment |
| Desktop review flow | Load schema sample → **Build review plan** | Passed — finding, citations, proposed checks, `write intent: false`, and human gate rendered |
| Narrow-screen flow | System Chrome at 390×844 | Passed — review flow worked; no horizontal overflow |
| Keyboard flow | Tab traversal to input and native button activation path | Passed — focus reaches the incident form; all actions use semantic buttons/controls with visible focus styling |
| Reduced motion | Browser emulation with `prefers-reduced-motion: reduce` | Passed — same static information and controls available; CSS forces any future transition/animation to an immediate settled state |
| Empty / disabled / error / success states | Initial review panel; disabled Copy control; whitespace validation; completed review package | Passed — initial empty guidance, disabled Copy control, inline validation status, and review-ready result are distinct |
| Motion advisory | `audit_web_motion.py` on project source | Passed — 0 errors, 0 warnings, 0 info findings; advisory only |

Representative inspected screenshots were captured locally for desktop and 390px mobile. They are not shipped as product assets.
