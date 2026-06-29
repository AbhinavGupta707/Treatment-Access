# Checkpoint 8 RPA Orchestrator Proof Handoff

Date: 2026-06-29

Lane: Orchestrator RPA Portal Fallback Proof

## Summary

Prepared the final H3 proof path for the real `PayerPortalFallback` UiPath RPA
project against the synthetic mock payer portal. No robot run, debug session,
Orchestrator job start, solution upload/publish/deploy/activation, event write,
or portal submission was performed.

The current proof status is **prepared, not executed**: the RPA project and
solution registration exist and validate locally, but `Main.xaml` still needs
Studio/UIA indication for the portal controls before any live smoke can be
claimed.

## Files Changed

- `scripts/verify-checkpoint8-rpa-proof.ts`
- `package.json`
- `uipath/robots/payer-portal-fallback/live-smoke-approval-gate.md`
- `uipath/robots/payer-portal-fallback/validation-notes.md`
- `uipath/solution/treatment-access-command-center/README.md`
- `docs/checkpoint-8-lane-handoffs/rpa-orchestrator-proof.md`

## Runtime / License Status

Read-only local/cloud readiness from prior validation shows:

- Target folder: `TreatmentAccessHackathon`
- Folder ID: `7986316`
- Folder key: `4fba2fa1-012b-469a-b6aa-e5be3811c173`
- Local `.NET 8` is required for UiPath workflow compiler commands; use
  `scripts/uipath-with-dotnet8.sh`.
- The solution lists `PayerPortalFallback` as a `Process` and pack dry-run has
  returned `Status: Valid`.
- The RPA workflow is still an empty validate/build-capable shell. UIA target
  capture has not been performed.
- Runtime/license discovery must be rechecked immediately before live smoke:
  `uip or folders runtimes TreatmentAccessHackathon --output json`,
  `uip or machines list --folder-path TreatmentAccessHackathon --all-fields --output json`,
  and
  `uip or sessions attended list --folder-path TreatmentAccessHackathon --output json`.

Known blocker until resolved: no H3 claim is valid until the TODO Indicate steps
in `uipath/robots/payer-portal-fallback/studio-indication-checklist.md` are
completed and `Main.xaml` is revalidated/rebuilt.

## Approval-Needed Commands

All commands below are side-effecting and require explicit orchestrator/user
approval before execution.

Studio/UIA indication:

```bash
open "uipath/robots/PayerPortalFallback/Main.xaml"
```

Attended/local robot proof:

```bash
uip rpa run "uipath/robots/PayerPortalFallback" --input-arguments "{\"portalUrl\":\"http://127.0.0.1:8788\",\"apiBaseUrl\":\"http://127.0.0.1:8787\",\"caseId\":\"case-syn-001\",\"patientId\":\"patient-synth-001\",\"orderId\":\"order-synth-001\",\"memberId\":\"SYN-MEMBER-001\",\"medication\":\"Fictionalimab\",\"diagnosis\":\"Moderate-to-severe inflammatory bowel disease\",\"evidenceRefs\":[\"artifact-progress-note\",\"artifact-med-history\",\"artifact-safety-labs\"],\"demoRunId\":\"demo-run-syn-rpa-001\"}" --output json
```

Assistant/debug alternative:

```bash
uip rpa debug start "uipath/robots/PayerPortalFallback" --input-arguments "{\"portalUrl\":\"http://127.0.0.1:8788\",\"apiBaseUrl\":\"http://127.0.0.1:8787\",\"caseId\":\"case-syn-001\",\"patientId\":\"patient-synth-001\",\"orderId\":\"order-synth-001\",\"memberId\":\"SYN-MEMBER-001\",\"medication\":\"Fictionalimab\",\"diagnosis\":\"Moderate-to-severe inflammatory bowel disease\",\"evidenceRefs\":[\"artifact-progress-note\",\"artifact-med-history\",\"artifact-safety-labs\"],\"demoRunId\":\"demo-run-syn-rpa-001\"}" --output json
```

Solution publish/deploy/job path:

```bash
scripts/uipath-with-dotnet8.sh uip solution pack "uipath/solution/treatment-access-command-center" ".artifacts/uipath" --output json
uip solution publish ".artifacts/uipath/<solution-package>.zip" --output json
uip solution deploy config get "<package-name>" --destination ".artifacts/uipath/tacc-rpa-deploy-config.json" --output json
uip solution deploy run --name "tacc-rpa-proof-demo-run-syn-rpa-001" --package-name "<package-name>" --package-version "<package-version>" --folder-name "TreatmentAccessHackathon" --parent-folder-key "4fba2fa1-012b-469a-b6aa-e5be3811c173" --config-file ".artifacts/uipath/tacc-rpa-deploy-config.json" --output json
uip solution deploy status "<pipeline-deployment-id>" --output json
uip or processes list --folder-path "TreatmentAccessHackathon" --output json
uip or jobs start "<process-key>" --folder-path "TreatmentAccessHackathon" --runtime-type Development --jobs-count 1 --input-arguments "{\"portalUrl\":\"http://127.0.0.1:8788\",\"apiBaseUrl\":\"http://127.0.0.1:8787\",\"caseId\":\"case-syn-001\",\"patientId\":\"patient-synth-001\",\"orderId\":\"order-synth-001\",\"memberId\":\"SYN-MEMBER-001\",\"medication\":\"Fictionalimab\",\"diagnosis\":\"Moderate-to-severe inflammatory bowel disease\",\"evidenceRefs\":[\"artifact-progress-note\",\"artifact-med-history\",\"artifact-safety-labs\"],\"demoRunId\":\"demo-run-syn-rpa-001\"}" --wait-for-completion --timeout 300 --output json
```

If deployment is created inactive:

```bash
uip solution deploy activate "tacc-rpa-proof-demo-run-syn-rpa-001" --output json
```

## Confirmation Write-Back

After an approved run, the event mirror must receive a robot-authored event:

```json
{
  "case_id": "case-syn-001",
  "actor_type": "robot",
  "actor_name": "PayerPortalFallback",
  "task_or_agent_name": "Mock Payer Portal Robot",
  "action": "payer_portal_fallback_submitted",
  "input_summary": "UiPath robot submitted synthetic prior authorization through mock payer portal.",
  "output_summary": "Portal confirmation AVFH-PORTAL-SYN-001 recorded for demo-run-syn-rpa-001.",
  "evidence_refs": [
    "artifact-progress-note",
    "artifact-med-history",
    "artifact-safety-labs"
  ],
  "orchestrator_job_id": "<approved-run-or-job-id>",
  "trace_id": "demo-run-syn-rpa-001"
}
```

Integration note: `uipath/api-workflows/write-event.workflow.json` currently
hardcodes `actor_type=api_workflow`. Either update that workflow to accept
`actorType=robot` or use another approved UiPath-owned writer to call the mock
API `/events` endpoint with `actor_type=robot`; otherwise the Command Center
must not claim a robot-authored write-back.

## Commands To Run Before Approval

No-side-effect checks:

```bash
CI=true pnpm verify:rpa-portal-fallback
UIPATH_OPTIONAL_TIMEOUT_SECONDS=10 CI=true pnpm uipath:readiness local
CI=true pnpm verify:setup
git diff --check
```

Run the mock portal build if the portal is touched:

```bash
CI=true pnpm --filter @tacc/mock-payer-portal build
```

## Integration Notes

- Keep `robot_requested` separate from `confirmation_received`; only the latter
  can include a portal confirmation ID.
- Do not use Playwright, raw DOM, HTTP form post, or local UI-only state as the
  robot proof substitute.
- All values are synthetic. Do not add real patient, payer, provider,
  credential, or health data.
- Merge after lanes 1 and 2 confirm the canonical live event source. If their
  event writer changes the schema, preserve
  `payer_portal_fallback_submitted`, `actor_type=robot`, `orchestrator_job_id`,
  `confirmationId`, and `demoRunId`.
