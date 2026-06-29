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
