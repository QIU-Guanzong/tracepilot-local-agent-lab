# Local validation record

Checked on 2026-09-23. All provider tests used fake fetch responses; no Nebius, NVIDIA, or other external model request was made. These results do not establish cloud runtime, eligibility, competition, payment, or submission outcomes.

| Check | Evidence | Result |
| --- | --- | --- |
| Provider, proxy, and server tests | Node 26.9: `npm test` | Passed — 18 tests cover input bounds, deterministic fallback, server-key isolation, same-origin routing, call cap, fake response validation, timeouts, and safe errors |
| Diff hygiene | `git diff --check` | Passed — no whitespace errors |
| Offline desktop flow | Playwright local server, 1280px viewport | Passed — initial offline state and deterministic review package; no external request; console errors/warnings: 0 |
| Opt-in flow | Separate local server with an in-process fake provider | Passed — remote option stays hidden until server configuration, unchecked confirmation sends no request, checked synthetic sample returns a bounded review result, and confirmation resets afterward |
| Request privacy | Playwright request log and fake-provider counter | Passed — the browser called only the loopback `/api/plan`; fake fetch handled the upstream slot, so no external model call occurred |
| Stale-result invalidation | Browser flow after generating a local plan | Passed — editing an input or selecting another sample clears the old plan and disables Copy until a fresh plan is built |
| Narrow-screen layout | Playwright at 390×844 | Passed — complete review flow, no horizontal overflow |
| Keyboard and reduced motion | Playwright tab focus and `prefers-reduced-motion: reduce` emulation | Passed — the skip link and controls are keyboard reachable; reduced motion matched and CSS transition duration was effectively zero |
| Screenshot review | Local desktop and full-page 390px screenshots | Passed — hierarchy, form, results, and provider disclosure inspected; screenshots are temporary review artifacts, not product assets |

The public GitHub Pages preview was not redeployed by this local validation. Even after source publication, it remains a deterministic mock and does not provide live Nebius/NVIDIA evidence.
