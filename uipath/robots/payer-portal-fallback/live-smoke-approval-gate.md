# Live Smoke Approval Gate

This path is intentionally blocked until the orchestrator/user approves each
side-effecting action. All data must remain synthetic.

## Preconditions

1. Install a .NET SDK visible to the UiPath Assistant/Robot headless Studio
   restore path, or configure `HELM_NUGET_SOURCE` to a working local feed that
   does not require `dotnet restore` from the Assistant runtime alone.
2. Create the real project with `uip rpa init`; do not hand-write RPA
   scaffolding.
3. Register the real project into
   `uipath/solution/treatment-access-command-center` through
   `uip solution project add` or `uip solution project import`.
4. Use UiPath UI Automation target capture or Studio Indicate for every portal
   control listed in `studio-indication-checklist.md`.
5. Run static local validation only:

```bash
uip rpa analyzer-rules list --project-dir "uipath/robots/PayerPortalFallback" --output json
uip rpa validate --file-path "Main.xaml" --project-dir "uipath/robots/PayerPortalFallback" --output json
uip rpa build "uipath/robots/PayerPortalFallback" --log-level Warn --output json
uip solution project list --solution-folder uipath/solution/treatment-access-command-center --output json
uip solution pack uipath/solution/treatment-access-command-center --dry-run --output json
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
- The UiPath-written event mirror record with
  `action=payer_portal_fallback_submitted` and `actor=robot`.
- The Command Center timeline showing the robot/fallback event sourced from the
  UiPath-written event record.
