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
