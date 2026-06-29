# Command Center Live Proof UX Handoff

## Lane

- Checkpoint 7 lane: Command Center Live Proof UX
- Ownership: `apps/command-center/**`
- Base: `02ddaf0 Prepare checkpoint 7 live UiPath proof plan`

## Files Changed

- `apps/command-center/src/lib/types.ts`
  - Added Command Center-local live proof UI contract types:
    `LiveProofRun`, `LiveProofStep`, `LiveProofTrace`,
    `LiveProofApprovalGate`, and `UiPathEvidenceRef`.
- `apps/command-center/src/lib/api.ts`
  - Added `POST /live-proof/runs` client adapter.
  - Parses live proof run envelopes from `liveProofRun`, `live_proof_run`, or
    `run`.
  - Added an honest synthetic contract preview when the live proof API is not
    present yet.
- `apps/command-center/src/main.tsx`
  - Added primary "Run live proof" dashboard action.
  - Added product-first proof panel showing value, progress, current work,
    human gate, and source state.
  - Added proof detail drawer with agent work, clinician gate, trace/source
    labels, and no-overclaim safety copy.
- `apps/command-center/src/styles.css`
  - Added responsive dark SaaS styling for the live proof panel, proof drawer,
    step cards, source labels, progress meter, and mobile wrapping.
  - Removed mobile `100vw` workspace sizing to reduce clipping risk.
- `apps/command-center/index.html`
  - Added a no-JavaScript fallback heading for accessibility/static audit.

## Runtime Contract Notes

- The primary run action calls `POST /live-proof/runs` with:

```json
{ "case_id": "case-syn-001" }
```

- The UI accepts a returned run directly or wrapped as:
  - `{ "liveProofRun": ... }`
  - `{ "live_proof_run": ... }`
  - `{ "run": ... }`
- Until lane 1 is merged, the UI opens a clearly labeled synthetic preview:
  "Live proof API not available yet; showing contract-ready synthetic preview."
- The UI does not claim to be source of truth. It says governed UiPath records
  produce live state and the Command Center visualizes them.
- No real payer submission, autonomous clinical/legal decision, or real patient
  data is implied.

## Checks Run

- `CI=true pnpm build:contracts` - passed
- `CI=true pnpm --filter @tacc/command-center typecheck` - passed
- `CI=true pnpm --filter @tacc/command-center build` - passed
- `TACC_COMMAND_CENTER_URL=http://127.0.0.1:5175 CI=true pnpm smoke:checkpoint6-ui` - passed
- `CI=true pnpm verify:setup` - passed
- `git diff --check` - passed
- `python3 /Users/abhinavgupta/.codex/skills/webdesign/scripts/website_quality_audit.py apps/command-center`
  - P0=0, P1=0, P2=32. Remaining P2s are mostly pre-existing spacing-token and
    tight-gap static heuristics in the existing CSS system.

## Screenshots / Browser Checks

- Dev server: `http://127.0.0.1:5175` because ports 5173 and 5174 were already
  occupied.
- Desktop screenshot:
  `/private/tmp/tacc-cp7-command-center/desktop-dashboard.png`
- Mobile screenshot:
  `/private/tmp/tacc-cp7-command-center/mobile-dashboard.png`
- Browser tool note:
  - Codex in-app browser backend was unavailable: no IAB backend discovered.
  - Chrome headless screenshot capture worked, though Chrome did not exit
    cleanly without a timeout because of local updater/background process noise.
  - CDP screenshot capture timed out, but a CDP viewport probe reported no
    document overflow before the content-wait path became flaky.

## Risks

- Lane 1 may choose a different live proof route name. If so, update
  `startLiveProofRun` in `apps/command-center/src/lib/api.ts`; the UI contract
  is otherwise isolated.
- Shared live proof schemas are intentionally not added here because lane 1 owns
  shared schema/runtime contracts.
- The static web audit still reports P2 spacing heuristics against the existing
  CSS architecture. No P0/P1 findings remain.

## Next Integration Notes

- After lane 1 merges, prefer replacing the local live proof UI types with the
  shared schema exports if the names match.
- Keep the detail drawer as the destination for Fireworks, LangSmith, UiPath,
  and event-mirror evidence. The main dashboard should stay product-first.
- If the API returns a LangSmith `trace_url`, the drawer will show an "Open
  trace" link. If only `trace_id` is present, it displays metadata only.
