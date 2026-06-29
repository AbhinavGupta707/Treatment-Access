# Treatment Access Command Center Solution

Local UiPath solution shell for the Checkpoint 4 runtime path.

This solution was created with:

```bash
uip solution init uipath/solution/treatment-access-command-center --output json
```

The manifest currently has no registered projects because the RPA project could
not be initialized on this Mac without a .NET SDK for the UiPath headless Studio
restore.

`uip solution pack ... --dry-run` is expected to fail until at least one project
is registered. The observed failure was `Solution definition empty or not
found`, with no upload, publish, deploy, or activation side effect.

## Intended Project Set

When local project creation is unblocked, register these artifacts in this
solution path:

- `PayerPortalFallback`: RPA process for the mock payer portal fallback.
- Validated CP3 agent projects: coverage requirement, evidence retrieval,
  missing evidence, submission packet, denial rescue, appeal packet, care
  continuity, and audit packet, after the orchestrator chooses the final
  solution packaging boundary.
- API workflows used by the case path, if the orchestrator packages them as
  solution projects rather than keeping them as local workflow artifacts.

## Runtime Wiring

1. Maestro or API workflow attempts `payer-prior-auth-submit.workflow.json`.
2. If the response has `fallbackRequired=true` or the API unavailable path is
   selected for demo, UiPath invokes the `PayerPortalFallback` process in the
   `TreatmentAccessHackathon` folder.
3. The robot opens `TACC_PAYER_PORTAL_URL`, fills the synthetic member ID,
   medication, and diagnosis fields, submits, and reads the confirmation region.
4. UiPath writes a fallback event through `write-event.workflow.json` or the
   approved event mirror path:
   `action=payer_portal_fallback_submitted`,
   `actor=robot`, `confirmationId`, `robotJobId`, `caseId`, and `demoRunId`.
5. The Command Center reads the UiPath-written event mirror and displays the
   fallback path. The UI must not synthesize live case state on its own.

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
- Publishing the RPA package or solution.
- Starting an Orchestrator job.
- Writing fallback events or portal submissions, even with synthetic data.
