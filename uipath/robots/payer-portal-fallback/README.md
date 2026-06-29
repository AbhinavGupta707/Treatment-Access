# Payer Portal Fallback Robot

This folder defines the Checkpoint 5 robot contract and local runtime plan for
the synthetic payer portal fallback story.

## Intended UiPath Project

Project name: `PayerPortalFallback`

Allowed creation command:

```bash
uip rpa init --name "PayerPortalFallback" --location "uipath/robots" --template-id "BlankTemplate" --expression-language VisualBasic --target-framework Portable --description "Synthetic payer portal prior authorization fallback robot for Treatment Access Command Center." --output json
```

The command was re-attempted on 2026-06-29 in the Checkpoint 5 RPA lane and did
not create a project because the local UiPath Assistant Robot bundled `dotnet`
runtime still cannot run `dotnet restore` without a .NET SDK.

Blocked error excerpt:

```text
The application 'restore' does not exist.
No .NET SDKs were found.
```

Do not hand-write `project.json`, `project.uiproj`, or a fake solution project
entry to bypass this. Once the SDK/Helm restore prerequisite is fixed, first
rerun the command above. If it creates the project directly under the solution
folder, register it in the local solution with:

```bash
uip solution project add uipath/solution/treatment-access-command-center/PayerPortalFallback uipath/solution/treatment-access-command-center/treatment-access-command-center.uipx --output json
```

If the project is created under `uipath/robots/PayerPortalFallback` instead,
use `uip solution project import --source uipath/robots/PayerPortalFallback`
from the solution folder so the project is copied into the solution before
registration.

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
- `validation-notes.md` records the local CLI evidence and hard stop.
- `live-smoke-approval-gate.md` lists the exact approval gates before any live
  robot execution, Orchestrator job start, solution publish/deploy, event write,
  or payer portal submission.
