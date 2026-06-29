# UiPath Setup

## Verified Local Setup

- UiPath CLI: installed as `uip`
- UiPath CLI auth: `abhinavg707@gmail.com`
- UiPath Assistant: installed at `/Applications/UiPath Assistant.app`
- Assistant/Robot session: available on `ABHINAVS-MINI`
- Project folder: `TreatmentAccessHackathon`
- Folder ID: `7986316`
- Folder key: `4fba2fa1-012b-469a-b6aa-e5be3811c173`
- Current user role in folder: `Folder Administrator`
- Action Center task-eligible user: `Abhinav Gupta`
- Connected workspace machine assigned to project folder:
  `abhinavg707@gmail.com's workspace machine`
- Project folder runtime now includes `Development: Total 1, Connected 1,
Available 1`

## Verified UiPath Services

The following services were discovered as enabled or reachable:

- Orchestrator
- Studio Web
- Agents
- Apps
- Assistant
- Maestro Operator
- Data Service / Data Fabric
- Integration Service
- Actions / Action Center
- Document Understanding
- Test Manager
- Automation Solutions

## IXP / Document Understanding Setup

Document Understanding is listed above as reachable in this tenant, but the
current local CLI surface does not expose the Checkpoint 3 `uip ixp` commands.

Read-only discovery attempted on 2026-06-29:

```bash
uip ixp projects list --output json
```

Result:

```text
ValidationError: unknown command 'ixp'
```

Layer-order diagnosis: this is a CLI command registration/tool-surface blocker,
not evidence of an IXP project permission or runtime extraction failure. Before
debugging IXP project access, install or update the UiPath CLI/tooling that
registers the `ixp` command prefix, then rerun read-only discovery. Do not
create, upload, label, delete, publish, or mutate IXP projects until explicitly
approved.

Checkpoint 3 fallback artifacts live in
`uipath/agents/extraction/fallback-parser-contract.json` and preserve
`extraction_method = "fallback_parser"`, source spans, and confidence values so
later IXP/Document Understanding output can swap into the same shared schemas.

## Folder Separation

Use this folder for Treatment Access work:

```text
TreatmentAccessHackathon
```

Do not use the separate `AgentFactoryDemo` folder for this project.

## Local Coding-Agent Skills

Regenerate project-local UiPath skills when needed:

```bash
uip skills install --agent codex --local
```

## Useful Verification Commands

```bash
uip user --output table
uip tools list --output table
uip or folders get "TreatmentAccessHackathon" --output table
uip or folders runtimes "TreatmentAccessHackathon" --output table
uip or machines list --folder-path "TreatmentAccessHackathon" --all-fields --output table
uip or users list-in-folder --folder-path "TreatmentAccessHackathon" --output table
uip tasks users 7986316 --output table
uip df entities list --output table
uip agent list --output table
uip or sessions attended list --folder-path "TreatmentAccessHackathon" --output table
```

## Runtime State

Assistant/Robot is installed and has an available attended session from `ABHINAVS-MINI`. The connected workspace machine has been assigned to the `TreatmentAccessHackathon` folder. The folder currently reports:

- `Development`: `Total 1`, `Connected 1`, `Available 1`
- `Serverless`: `Total 1`, `Connected 0`, `Available 0`
- `ServerlessTestAutomation`: `Total 1`, `Connected 0`, `Available 0`
- `Unattended`: `Total 0`, `Connected 0`, `Available 0`

This is enough to proceed with development and later attended/development-mode RPA fallback testing from the project folder. It does not yet reserve the tenant's single available `Unattended` license. Only allocate the unattended slot if the final portal fallback must run as a fully unattended Orchestrator job instead of a demo/development attended run.

Before recording the final RPA demo:

- publish the portal automation package/process;
- verify whether it runs against the available `Development` runtime or needs a dedicated unattended machine;
- if unattended is required, create/assign a project machine with one unattended slot and enable the `Unattended` license;
- run an Orchestrator job end-to-end and confirm the Command Center receives the portal confirmation event.

## RPA Project Readiness

The RPA command surface is registered locally:

```bash
uip --version
uip rpa init --help --output json
uip solution init --help --output json
```

The real project creation command was successfully rerun on 2026-06-29 after
installing .NET 8 side-by-side with the existing .NET 10 install:

```bash
uip rpa init --name "PayerPortalFallback" --location "uipath/robots" --template-id "BlankTemplate" --expression-language VisualBasic --target-framework Portable --description "Synthetic payer portal prior authorization fallback robot for Treatment Access Command Center." --output json
```

Project shell now exists at:

```text
uipath/robots/PayerPortalFallback
uipath/solution/treatment-access-command-center/PayerPortalFallback
```

Use the repo helper when running UiPath RPA build/pack commands locally. It
selects Homebrew's .NET 8 install when present:

```bash
scripts/uipath-with-dotnet8.sh uip rpa build "uipath/robots/PayerPortalFallback" --log-level Warn --output json
scripts/uipath-with-dotnet8.sh uip solution pack "uipath/solution/treatment-access-command-center" --dry-run --output json
```

Verified local checks after the fix:

- `uip rpa validate --file-path Main.xaml --output json` from
  `uipath/robots/PayerPortalFallback` returned no diagnostics.
- `scripts/uipath-with-dotnet8.sh uip rpa build ...` returned
  `Data.Success=true`.
- `uip solution project import --source ... --solutionFile ...` imported the
  project into `treatment-access-command-center.uipx`.
- `uip solution project list --solution-folder ... --output json` lists
  `PayerPortalFallback` as a `Process`.
- `uip solution resource refresh --solution-folder ... --output json` returned
  no warnings and no external bindings.
- `scripts/uipath-with-dotnet8.sh uip solution pack ... --dry-run --output json`
  returned `Status=Valid`.

Do not hand-write UiPath project metadata. Follow
`uipath/robots/payer-portal-fallback/live-smoke-approval-gate.md` before any
robot execution, Orchestrator job start, solution publish/deploy, event write,
or portal submission.

## Orchestrator Assets To Create Later

Create these after the mock services are deployed:

```text
TACC_MOCK_API_BASE_URL
TACC_COMMAND_CENTER_URL
TACC_PAYER_PORTAL_URL
TACC_EVENT_API_KEY
TACC_PORTAL_CREDENTIALS
TACC_DEMO_MODE
```

Do not commit secrets. Use Orchestrator assets, Vercel environment variables, or local `.env` files excluded from git.
