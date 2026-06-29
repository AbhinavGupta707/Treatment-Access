# Payer Portal Fallback Robot

This folder defines the Checkpoint 5 robot contract and local runtime plan for
the synthetic payer portal fallback story.

## Intended UiPath Project

Project name: `PayerPortalFallback`

Allowed creation command:

```bash
uip rpa init --name "PayerPortalFallback" --location "uipath/robots" --template-id "BlankTemplate" --expression-language VisualBasic --target-framework Portable --description "Synthetic payer portal prior authorization fallback robot for Treatment Access Command Center." --output json
```

The command was rerun successfully on 2026-06-29 after installing .NET 8 via
Homebrew. It created the real UiPath project shell at
`uipath/robots/PayerPortalFallback`.

Verified local checks:

```bash
cd "uipath/robots/PayerPortalFallback"
uip rpa validate --file-path Main.xaml --output json
cd ../../..
scripts/uipath-with-dotnet8.sh uip rpa build "uipath/robots/PayerPortalFallback" --log-level Warn --output json
uip solution project import --source "uipath/robots/PayerPortalFallback" --solutionFile "uipath/solution/treatment-access-command-center/treatment-access-command-center.uipx" --output json
uip solution project list --solution-folder "uipath/solution/treatment-access-command-center" --output json
uip solution resource refresh --solution-folder "uipath/solution/treatment-access-command-center" --output json
scripts/uipath-with-dotnet8.sh uip solution pack "uipath/solution/treatment-access-command-center" --dry-run --output json
```

The source project is copied into the local solution by `uip solution project
import`. If future work creates a project directly under the solution folder,
register it with:

```bash
uip solution project add uipath/solution/treatment-access-command-center/PayerPortalFallback uipath/solution/treatment-access-command-center/treatment-access-command-center.uipx --output json
```

If future work edits the source project under `uipath/robots/PayerPortalFallback`,
re-import or sync the solution copy before pack/deploy validation.

After any successful `project add` or `project import`, verify membership with:

```bash
uip solution project list --solution-folder uipath/solution/treatment-access-command-center --output json
```

## Runtime Role

The robot is invoked only after UiPath-owned submission logic detects that the
mock payer API path is unavailable or returns `fallbackRequired=true`. It opens
the local mock payer portal, submits synthetic prior authorization fields through
UiPath UI Automation activities, reads the confirmation region, and returns the
confirmation ID for UiPath event recording.

The custom Command Center may display the fallback state, but live case state
must be produced by UiPath workflows, agents, robots, human actions, or
UiPath-written event records.

## Files

- `robot-contract.json` defines inputs, outputs, required assets, and event
  shape.
- `studio-indication-checklist.md` lists the UIA activities and portal targets
  that must be indicated in Studio.
- `validation-notes.md` records the local CLI evidence, .NET 8 fix, validation,
  build, import, resource refresh, and solution pack dry-run.
- `live-smoke-approval-gate.md` lists the exact approval gates before any live
  robot execution, Orchestrator job start, solution publish/deploy, event write,
  or payer portal submission.
