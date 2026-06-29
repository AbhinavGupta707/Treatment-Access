# Validation Notes

Date: 2026-06-29

## Commands Run

```bash
uip skills install --agent codex --local
uip rpa init --name "PayerPortalFallback" --location "uipath/robots" --template-id "BlankTemplate" --expression-language VisualBasic --target-framework Portable --description "Synthetic payer portal prior authorization fallback robot for Treatment Access Command Center." --output json
uip solution init uipath/solution/treatment-access-command-center --output json
uip solution project list --solution-folder uipath/solution/treatment-access-command-center --output json
uip login status --output json
uip or folders list --output json
uip or folders runtimes TreatmentAccessHackathon --output json
uip solution pack uipath/solution/treatment-access-command-center --dry-run --output json
node -e "for (const f of ['uipath/robots/payer-portal-fallback/robot-contract.json','uipath/solution/treatment-access-command-center/treatment-access-command-center.uipx']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
CI=true pnpm verify:setup
git diff --check
```

## Local RPA Hard Stop

`uip rpa init` returned a JSON envelope with `Result: Success`, but the nested
tool result was `success: false` and no project directory was created.

Blocking error:

```text
/Applications/UiPath Assistant.app/Contents/Robot/dotnet/dotnet restore failed
The application 'restore' does not exist.
No .NET SDKs were found.
```

Closest successful static checks:

- Local UiPath skills installed successfully after network approval.
- `uip rpa init --help --output json` confirmed the required `init` surface and
  explicit `--target-framework` / `--expression-language` flags.
- `uip solution init --help --output json` confirmed the post-rename solution
  CLI surface.
- `uip solution project list` confirmed the local solution shell is valid and
  currently has no registered projects.
- JSON parsing passed for `robot-contract.json` and the generated `.uipx`
  manifest.
- `CI=true pnpm verify:setup` passed after rerunning with network approval for
  npm registry access.
- `git diff --check` passed.
- Read-only Orchestrator discovery confirmed `TreatmentAccessHackathon` exists
  with folder key `4fba2fa1-012b-469a-b6aa-e5be3811c173`.
- Read-only runtime discovery reported `Development` runtime total `1`,
  connected `1`, available `1`.

Expected solution dry-run status:

- `uip solution pack ... --dry-run` failed with
  `Solution definition empty or not found` because the solution manifest has no
  registered projects until the RPA init blocker is resolved. No publish,
  upload, deploy, or activation was attempted.

## Not Run

The following were intentionally not run:

- `uip rpa run`
- `uip rpa debug start`
- `uip or jobs start`
- `uip solution upload`
- `uip solution publish`
- `uip solution deploy`
- `uip solution deploy activate`
- Any Maestro or Agent Builder debug action
- Any Action Center task creation
- Any Data Service write
- Any payer portal submission
