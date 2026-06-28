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
uip or users list-in-folder --folder-path "TreatmentAccessHackathon" --output table
uip tasks users 7986316 --output table
uip df entities list --output table
uip agent list --output table
uip or sessions attended list --output table
```

## Current Runtime Caveat

Assistant/Robot is installed and has an available attended session in the personal workspace. The project folder currently has serverless runtime allocation but no dedicated local/attended/unattended runtime slots. This is not blocking for Checkpoint 0 or API Workflow work.

Resolve during the RPA fallback checkpoint:

- confirm whether the portal robot should run from personal workspace or project folder;
- allocate/assign the required local or attended runtime if needed;
- verify Orchestrator job execution before recording the final demo.

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
