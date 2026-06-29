# RPA Portal Fallback Live-Smoke Hardening Handoff

Date: 2026-06-29

Lane: RPA Portal Fallback Live-Smoke Hardening

## Summary

Hardened the synthetic payer portal fallback proof so local artifacts clearly
distinguish:

1. `api_unavailable` / `payer_prior_auth_unavailable`
2. `robot_requested` / `robot_fallback_requested`
3. `confirmation_received` / `payer_portal_fallback_submitted`

No live RPA run/debug, Orchestrator job start, solution upload/publish/deploy,
Action Center task creation, Data Service write, or payer submission was run.

## Files Changed

- `apps/mock-payer-portal/src/main.tsx`
  - Added explicit fallback stage constants.
  - Exposed stable `data-stage-id`, `data-mirror-action`, `data-actor-type`, and
    `data-source` attributes for the status rail, form request state, and
    confirmation region.
  - Changed visible copy from generic fallback/submission language to
    `Robot requested` and `Confirmation received`.
  - Added a no-real-payer-submission confirmation disclaimer.
- `apps/mock-payer-portal/src/styles.css`
  - Added stage badge styling for the request/confirmation state.
- `uipath/robots/payer-portal-fallback/robot-contract.json`
  - Added `fallbackStateMachine` with the three state/action semantics.
  - Added `fallbackRequestEvent` for request/preparation state.
  - Changed output status values from `submitted` / `needs_capture` to
    `api_unavailable` / `robot_requested` / `confirmation_received` / `failed`.
- `uipath/robots/payer-portal-fallback/README.md`
  - Documented the three event states and the rule not to collapse request state
    into confirmation state.
- `uipath/robots/payer-portal-fallback/live-smoke-approval-gate.md`
  - Added the semantic precondition and the new local guard command.
  - Clarified that `robot_requested` is not a payer confirmation.
- `uipath/robots/payer-portal-fallback/validation-notes.md`
  - Recorded the Checkpoint 7 semantic guard and state contract.
- `uipath/solution/treatment-access-command-center/README.md`
  - Updated runtime wiring so request state happens before any approved portal
    submit/confirmation state.
- `scripts/verify-rpa-portal-fallback.ts`
  - New local semantic guard that checks portal source and robot contract
    alignment without starting servers or UiPath jobs.
- `package.json`
  - Added `verify:rpa-portal-fallback`.

## Commands Run

Successful:

```bash
CI=true pnpm verify:rpa-portal-fallback
CI=true pnpm --filter @tacc/mock-payer-portal build
CI=true pnpm verify:setup
CI=true pnpm uipath:readiness local
CI=true pnpm exec prettier --write package.json apps/mock-payer-portal/src/main.tsx apps/mock-payer-portal/src/styles.css scripts/verify-rpa-portal-fallback.ts uipath/robots/payer-portal-fallback/README.md uipath/robots/payer-portal-fallback/live-smoke-approval-gate.md uipath/robots/payer-portal-fallback/robot-contract.json uipath/solution/treatment-access-command-center/README.md
```

The UiPath readiness wrapper performed command-surface discovery, local RPA
analyzer-rule discovery, `uip rpa validate --file-path Main.xaml`, RPA build
through `scripts/uipath-with-dotnet8.sh`, solution project listing, resource
refresh, and solution pack dry-run. It completed with no live side effects, and
solution pack dry-run returned `Status: Valid`.

Interrupted/retried:

```bash
CI=true pnpm verify:rpa-portal-fallback
CI=true pnpm --filter @tacc/mock-payer-portal build
```

The first attempts were interrupted because this isolated worktree needed to
hydrate dependencies and sandboxed DNS blocked package fetches. The same checks
were rerun successfully after dependency hydration.

## Risks

- `uipath/robots/PayerPortalFallback/Main.xaml` remains the real UiPath project
  shell. It has not been filled with UIA activities because live target
  indication and portal submission remain approval-gated.
- The local portal now exposes machine-readable stage attributes, but Command
  Center/runtime integration still needs to consume this contract after earlier
  Checkpoint 7 lanes merge their live proof schemas/API.
- No live robot/job/event-write proof was performed in this lane by design.

## Next Integration Notes

- Merge after lanes 1 and 2 confirm their live proof event schema names. If they
  introduce a canonical event enum, map these exact semantics into it:
  `payer_prior_auth_unavailable`, `robot_fallback_requested`, and
  `payer_portal_fallback_submitted`.
- Add `CI=true pnpm verify:rpa-portal-fallback` to any Checkpoint 7 aggregate
  smoke if the QA lane wants a cheap no-side-effect guard.
- Keep `robot_requested` visible as request/preparation state. Do not show
  `confirmation_received` until a UiPath-written event has a portal confirmation
  ID from an approved synthetic portal run.
