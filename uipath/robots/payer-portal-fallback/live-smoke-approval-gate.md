# Live Smoke Approval Gate

This path is intentionally blocked until the orchestrator/user approves each
side-effecting action. All data must remain synthetic.

## Preconditions

1. .NET 8 is available through Homebrew `dotnet@8`; use
   `scripts/uipath-with-dotnet8.sh` for local build/pack checks.
2. The real project exists at `uipath/robots/PayerPortalFallback` and is
   imported into `uipath/solution/treatment-access-command-center`.
3. Use UiPath UI Automation target capture or Studio Indicate for every portal
   control listed in `studio-indication-checklist.md`.
4. Confirm the local fallback event semantics before any live action:

```text
api_unavailable -> payer_prior_auth_unavailable -> actor_type=api_workflow
robot_requested -> robot_fallback_requested -> actor_type=robot
confirmation_received -> payer_portal_fallback_submitted -> actor_type=robot
```

`robot_requested` is request/preparation state only. It must not be treated as a
portal confirmation, payer submission, or completed Orchestrator job.

5. Run static local validation only:

```bash
cd "uipath/robots/PayerPortalFallback"
uip rpa analyzer-rules list --scope Workflow --output json
uip rpa validate --file-path "Main.xaml" --output json
cd ../../..
scripts/uipath-with-dotnet8.sh uip rpa build "uipath/robots/PayerPortalFallback" --log-level Warn --output json
uip solution project list --solution-folder uipath/solution/treatment-access-command-center --output json
uip solution resource refresh --solution-folder uipath/solution/treatment-access-command-center --output json
scripts/uipath-with-dotnet8.sh uip solution pack uipath/solution/treatment-access-command-center --dry-run --output json
```

Equivalent one-command safe readiness wrapper:

```bash
CI=true pnpm uipath:readiness -- local
```

Checkpoint 7 local semantic guard:

```bash
CI=true pnpm verify:rpa-portal-fallback
```

## Approval Required Before Live Smoke

Ask for explicit approval before each action below:

- Studio/UIA indication against the running local mock payer portal.
- `uip rpa run` or `uip rpa debug start`.
- `uip or jobs start`.
- `uip solution upload`, `uip solution publish`, `uip solution deploy`, or
  `uip solution deploy activate`.
- Any write through `write-event.workflow.json`.
- Any portal submission, even to the synthetic local mock payer portal.

## Exact Approval-Gated Command Path

Set these local variables in the terminal before running the approved smoke.
Use only synthetic values.

```bash
export TACC_PAYER_PORTAL_URL="http://127.0.0.1:8788"
export TACC_MOCK_API_BASE_URL="http://127.0.0.1:8787"
export TACC_CASE_ID="case-syn-001"
export TACC_DEMO_RUN_ID="demo-run-syn-rpa-001"
```

Start the mock services in separate terminals if they are not already running:

```bash
CI=true pnpm --filter @tacc/mock-healthcare-api build
pnpm dev:api
CI=true pnpm --filter @tacc/mock-payer-portal build
pnpm dev:mock-payer
```

After explicit approval for Studio/UIA indication, open
`uipath/robots/PayerPortalFallback/Main.xaml` in Studio and complete every item
in `studio-indication-checklist.md`. Re-run the static checks:

```bash
cd "uipath/robots/PayerPortalFallback"
uip rpa analyzer-rules list --scope Workflow --output json
uip rpa validate --file-path "Main.xaml" --output json
cd ../../..
scripts/uipath-with-dotnet8.sh uip rpa build "uipath/robots/PayerPortalFallback" --log-level Warn --output json
uip solution project import --source "uipath/robots/PayerPortalFallback" --solutionFile "uipath/solution/treatment-access-command-center/treatment-access-command-center.uipx" --output json
uip solution project list --solution-folder "uipath/solution/treatment-access-command-center" --output json
uip solution resource refresh --solution-folder "uipath/solution/treatment-access-command-center" --output json
scripts/uipath-with-dotnet8.sh uip solution pack "uipath/solution/treatment-access-command-center" --dry-run --output json
```

After explicit approval for an attended local robot smoke, run either:

```bash
uip rpa run "uipath/robots/PayerPortalFallback" --input-arguments "{\"portalUrl\":\"${TACC_PAYER_PORTAL_URL}\",\"apiBaseUrl\":\"${TACC_MOCK_API_BASE_URL}\",\"caseId\":\"${TACC_CASE_ID}\",\"patientId\":\"patient-synth-001\",\"orderId\":\"order-synth-001\",\"memberId\":\"SYN-MEMBER-001\",\"medication\":\"Fictionalimab\",\"diagnosis\":\"Moderate-to-severe inflammatory bowel disease\",\"evidenceRefs\":[\"artifact-progress-note\",\"artifact-med-history\",\"artifact-safety-labs\"],\"demoRunId\":\"${TACC_DEMO_RUN_ID}\"}" --output json
```

or:

```bash
uip rpa debug start "uipath/robots/PayerPortalFallback" --input-arguments "{\"portalUrl\":\"${TACC_PAYER_PORTAL_URL}\",\"apiBaseUrl\":\"${TACC_MOCK_API_BASE_URL}\",\"caseId\":\"${TACC_CASE_ID}\",\"patientId\":\"patient-synth-001\",\"orderId\":\"order-synth-001\",\"memberId\":\"SYN-MEMBER-001\",\"medication\":\"Fictionalimab\",\"diagnosis\":\"Moderate-to-severe inflammatory bowel disease\",\"evidenceRefs\":[\"artifact-progress-note\",\"artifact-med-history\",\"artifact-safety-labs\"],\"demoRunId\":\"${TACC_DEMO_RUN_ID}\"}" --output json
```

After explicit approval for Orchestrator deployment and job start, use the
solution lifecycle path:

```bash
scripts/uipath-with-dotnet8.sh uip solution pack "uipath/solution/treatment-access-command-center" ".artifacts/uipath" --output json
uip solution publish ".artifacts/uipath/<solution-package>.zip" --output json
uip solution deploy config get "<package-name>" --destination ".artifacts/uipath/tacc-rpa-deploy-config.json" --output json
uip solution deploy run --name "tacc-rpa-proof-${TACC_DEMO_RUN_ID}" --package-name "<package-name>" --package-version "<package-version>" --folder-name "TreatmentAccessHackathon" --parent-folder-key "4fba2fa1-012b-469a-b6aa-e5be3811c173" --config-file ".artifacts/uipath/tacc-rpa-deploy-config.json" --output json
uip solution deploy status "<pipeline-deployment-id>" --output json
uip or processes list --folder-path "TreatmentAccessHackathon" --output json
uip or jobs start "<process-key>" --folder-path "TreatmentAccessHackathon" --runtime-type Development --jobs-count 1 --input-arguments "{\"portalUrl\":\"${TACC_PAYER_PORTAL_URL}\",\"apiBaseUrl\":\"${TACC_MOCK_API_BASE_URL}\",\"caseId\":\"${TACC_CASE_ID}\",\"patientId\":\"patient-synth-001\",\"orderId\":\"order-synth-001\",\"memberId\":\"SYN-MEMBER-001\",\"medication\":\"Fictionalimab\",\"diagnosis\":\"Moderate-to-severe inflammatory bowel disease\",\"evidenceRefs\":[\"artifact-progress-note\",\"artifact-med-history\",\"artifact-safety-labs\"],\"demoRunId\":\"${TACC_DEMO_RUN_ID}\"}" --wait-for-completion --timeout 300 --output json
```

If the deploy is created with `--skip-activate`, activation is a separate
approval-gated step:

```bash
uip solution deploy activate "tacc-rpa-proof-${TACC_DEMO_RUN_ID}" --output json
```

## Confirmation Write-Back

After an approved robot run returns or displays the synthetic confirmation ID,
the governed event path must receive a robot-authored event. The mock API
`/events` endpoint already validates `actor_type=robot`; the current
`write-event.workflow.json` hardcodes `actor_type=api_workflow`, so do not use
that workflow to claim a robot-authored confirmation until it accepts an
`actorType` input or another UiPath-owned writer is approved.

Expected payload shape:

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

Expected verification after write-back:

```bash
curl -s "${TACC_MOCK_API_BASE_URL}/cases/${TACC_CASE_ID}/events"
```

The returned event must include
`action=payer_portal_fallback_submitted`, `actor_type=robot`,
`orchestrator_job_id=<approved-run-or-job-id>`, and the confirmation ID in the
output summary or payload recorded by the final writer.

## Smoke Evidence To Capture After Approval

- The RPA run/debug or Orchestrator job ID.
- The synthetic portal confirmation ID.
- The UiPath-written request event mirror record with
  `action=robot_fallback_requested`, `actor=robot`, and
  `status=robot_requested`.
- The UiPath-written confirmation event mirror record with
  `action=payer_portal_fallback_submitted`, `actor=robot`, and
  `status=confirmation_received`.
- The Command Center timeline showing the robot/fallback event sourced from the
  UiPath-written event record.
