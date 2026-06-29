# Validation Notes

Date: 2026-06-29

## Commands Run

```bash
uip skills install --agent codex --local
uip --version
uip rpa init --help --output json
uip rpa init --name "PayerPortalFallback" --location "uipath/robots" --template-id "BlankTemplate" --expression-language VisualBasic --target-framework Portable --description "Synthetic payer portal prior authorization fallback robot for Treatment Access Command Center." --output json
dotnet --list-sdks
brew install dotnet@8
scripts/uipath-with-dotnet8.sh dotnet --info
uip rpa analyzer-rules list --scope Workflow --output json
uip rpa validate --file-path Main.xaml --output json
scripts/uipath-with-dotnet8.sh uip rpa build "uipath/robots/PayerPortalFallback" --log-level Warn --output json
uip solution init --help --output json
uip solution init uipath/solution/treatment-access-command-center --output json
uip solution project import --source "uipath/robots/PayerPortalFallback" --solutionFile "uipath/solution/treatment-access-command-center/treatment-access-command-center.uipx" --output json
uip solution project list --solution-folder uipath/solution/treatment-access-command-center --output json
uip solution resource refresh --solution-folder uipath/solution/treatment-access-command-center --output json
uip login status --output json
uip or folders get "TreatmentAccessHackathon" --output json
uip or folders runtimes TreatmentAccessHackathon --output json
scripts/uipath-with-dotnet8.sh uip solution pack uipath/solution/treatment-access-command-center --dry-run --output json
node -e "for (const f of ['uipath/robots/payer-portal-fallback/robot-contract.json','uipath/solution/treatment-access-command-center/treatment-access-command-center.uipx']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"
CI=true pnpm verify:setup
git diff --check
```

## Local RPA Runtime Fix

`uip rpa init` was rerun on 2026-06-29 with the explicit
`--target-framework Portable` and `--expression-language VisualBasic` flags. It
returned `success: true` and created:

```text
uipath/robots/PayerPortalFallback/project.json
uipath/robots/PayerPortalFallback/project.uiproj
uipath/robots/PayerPortalFallback/Main.xaml
```

The first build attempt exposed that the compiler specifically needs .NET 8:

```text
Framework: 'Microsoft.NETCore.App', version '8.0.0' (arm64)
The following frameworks were found:
  10.0.9 at [/usr/local/share/dotnet/shared/Microsoft.NETCore.App]
```

Homebrew `dotnet@8` was installed side-by-side under
`/opt/homebrew/opt/dotnet@8/libexec`. Use
`scripts/uipath-with-dotnet8.sh` for local RPA build and solution pack commands
so UiPath's workflow compiler runs with the required .NET 8 runtime/SDK.

Successful static checks after the fix:

- `uip rpa analyzer-rules list --scope Workflow --output json` returned enabled
  workflow analyzer rules.
- `uip rpa validate --file-path Main.xaml --output json` from the project folder
  returned `No diagnostics found`.
- `scripts/uipath-with-dotnet8.sh uip rpa build ...` returned
  `Result: Success` and `Data.Success=true`.
- `uip solution project import ...` imported the project as
  `PayerPortalFallback/project.uiproj`.
- `uip solution project list ...` lists `PayerPortalFallback` as a `Process`.
- `uip solution resource refresh ...` returned `Warnings: []` and no external
  resource bindings.
- `scripts/uipath-with-dotnet8.sh uip solution pack ... --dry-run --output json`
  returned `Status: Valid`.

Remaining implementation path:

1. Follow `studio-indication-checklist.md` to add/capture the real UiPath UI
   Automation activities against the synthetic mock payer portal.
2. Re-run RPA validate/build through `scripts/uipath-with-dotnet8.sh`.
3. Re-import or sync the solution copy if the source project changes.
4. Re-run `uip solution project list`, `uip solution resource refresh`, and
   solution pack dry-run.
5. Do not execute the robot or start a job until approval is granted per
   `live-smoke-approval-gate.md`.

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
