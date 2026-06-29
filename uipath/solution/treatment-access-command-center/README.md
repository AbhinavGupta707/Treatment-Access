# Treatment Access Command Center Solution

Local UiPath solution shell for the portal fallback runtime path.

This solution was created with:

```bash
uip solution init uipath/solution/treatment-access-command-center --output json
```

The manifest now registers the real `PayerPortalFallback` UiPath RPA project as
a `Process`. The source project was created under
`uipath/robots/PayerPortalFallback` with `uip rpa init`, then copied into this
solution with `uip solution project import`.

Local verification on 2026-06-29:

```bash
uip solution project list --solution-folder "uipath/solution/treatment-access-command-center" --output json
uip solution resource refresh --solution-folder "uipath/solution/treatment-access-command-center" --output json
scripts/uipath-with-dotnet8.sh uip solution pack "uipath/solution/treatment-access-command-center" --dry-run --output json
```

The same no-side-effect local checks are wrapped by:

```bash
CI=true pnpm uipath:readiness -- local
```

Results: `PayerPortalFallback` is listed as a `Process`, resource refresh
reported no warnings, and solution pack dry-run returned `Status: Valid`. No
upload, publish, deploy, or activation side effect was performed.

## Intended Project Set

Registered or intended artifacts:

- `PayerPortalFallback`: RPA process shell for the mock payer portal fallback
  is registered.
- Validated CP3 agent projects: coverage requirement, evidence retrieval,
  missing evidence, submission packet, denial rescue, appeal packet, care
  continuity, and audit packet, after the orchestrator chooses the final
  solution packaging boundary.
- API workflows used by the case path, if the orchestrator packages them as
  solution projects rather than keeping them as local workflow artifacts.

## Runtime Wiring

1. Maestro or API workflow attempts `payer-prior-auth-submit.workflow.json`.
2. If the response has `fallbackRequired=true` or the API unavailable path is
   selected for demo, UiPath writes or prepares
   `action=robot_fallback_requested` for `PayerPortalFallback` in the
   `TreatmentAccessHackathon` folder. This is request state, not a completed
   portal submission.
3. After explicit live-smoke approval, the robot opens `TACC_PAYER_PORTAL_URL`,
   fills the synthetic member ID, medication, and diagnosis fields, submits, and
   reads the confirmation region.
4. UiPath writes a confirmation event through `write-event.workflow.json` or the
   approved event mirror path:
   `action=payer_portal_fallback_submitted`,
   `actor=robot`, `confirmationId`, `robotJobId`, `caseId`, and `demoRunId`.
5. The Command Center reads the UiPath-written event mirror and displays the
   fallback path. The UI must not synthesize live case state on its own.

Fallback state labels for Checkpoint 7 consumers:

| State                   | Mirror action                     | Actor        | Meaning                                                       |
| ----------------------- | --------------------------------- | ------------ | ------------------------------------------------------------- |
| `api_unavailable`       | `payer_prior_auth_unavailable`    | API workflow | Direct API path is unavailable.                               |
| `robot_requested`       | `robot_fallback_requested`        | UiPath robot | Robot fallback prepared; no live job by default.              |
| `confirmation_received` | `payer_portal_fallback_submitted` | UiPath robot | Approved synthetic portal submission produced a confirmation. |

## Required Assets

- `TACC_PAYER_PORTAL_URL`: local mock payer portal URL.
- `TACC_MOCK_API_BASE_URL`: local mock healthcare/event API URL.
- `TACC_PAYER_PORTAL_USERNAME`: optional synthetic username if login exists.
- `TACC_PAYER_PORTAL_PASSWORD`: optional synthetic credential if login exists.

## Approval Gate For Live Smoke

Before live smoke, ask the orchestrator/user to approve each side-effecting
step:

- Studio/UIA indication against the running local mock portal.
- `uip rpa run` or `uip rpa debug start`.
- `uip or jobs start`.
- Publishing the RPA package or solution.
- Starting an Orchestrator job.
- Writing fallback events or portal submissions, even with synthetic data.

The detailed gated sequence is maintained in
`../../robots/payer-portal-fallback/live-smoke-approval-gate.md`.
