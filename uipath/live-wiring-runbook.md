# UiPath Live Wiring Runbook

This runbook makes the Checkpoint 6 live wiring path execution-ready while
keeping all live side effects behind explicit approval. UiPath remains the
orchestration and governance layer. The Command Center visualizes governed
state; live case state must be produced by UiPath workflows, agents, robots,
human actions, or UiPath-written event records.

Use only synthetic data. Do not enter real patient, payer, provider,
credential, or personal health data. Keep all work in the
`TreatmentAccessHackathon` folder, not `AgentFactoryDemo`.

## Safe Readiness Command

Run this before any live smoke approval meeting:

```bash
CI=true pnpm uipath:readiness
```

If cloud access is unavailable, run the local subset:

```bash
CI=true pnpm uipath:readiness -- local
```

For the Checkpoint 7 governed-hook contract only, run:

```bash
CI=true pnpm uipath:live-proof:readiness
```

The wrapper checks registration and discovery state first:

- `uip` command surface and installed tools;
- `solution`, `rpa`, `agent`, `codedagent`, `maestro case`, `tasks`, and
  `df` command registration;
- login, folder, runtime, machine, attended session, Action Center users/tasks,
  Data Fabric entity discovery, and Agent Builder project discovery;
- solution project list, resource refresh, pack dry-run;
- RPA analyzer rules, `Main.xaml` validation, and project build.
- live proof governed-hook manifest, future Coded Agent authoring contract, and
  synthetic event/request samples.

The wrapper does not run live agent jobs, Coded Agent jobs, Maestro debug/run,
Action Center task creation, Data Fabric record writes, Orchestrator job
starts, RPA run/debug, solution upload/publish/deploy/activate, or payer
submissions.

## Coded Agent Packaging Choice

The recommended live runtime remains either:

1. a UiPath Coded Agent that hosts the LangGraph runtime; or
2. a local service invoked by a UiPath API Workflow during the demo.

Do not hand-author a new Coded Agent shell. If the orchestrator approves the
Coded Agent route, create it with the CLI scaffold flow:

```bash
uip codedagent setup --output json
uip codedagent new TreatmentAccessLangGraphAgent --output json
cd TreatmentAccessLangGraphAgent
uip codedagent init --output json
```

After code adds any UiPath SDK resource calls, regenerate bindings through the
official Coded Agent sync workflow before packaging or running. The current
worktree has not executed this scaffold.

## Approval-Gated Live Commands

Every command in this section has live side effects or starts live execution.
Run one block at a time only after the orchestrator/user explicitly approves
that exact block and confirms the data is synthetic.

### Agent Builder Or Coded Agent Run

Read-only preflight:

```bash
uip agent run list --folder-id 7986316 --output json
uip codedagent setup --output json
```

Approved low-code Agent Builder job start:

```bash
uip agent run start "<AGENT_RELEASE_KEY_OR_PROCESS_NAME>" \
  --folder-id 7986316 \
  --inputs '{"caseId":"TACC-2026-001","synthetic":true}' \
  --output json
```

Approved Coded Agent local debug/run, only after the project is scaffolded by
`uip codedagent new` and initialized:

```bash
uip codedagent debug --output json
uip codedagent run --output json
```

Capture the agent job ID or Coded Agent run output, schema-validation result,
and trace ID. Do not use real clinical data.

### Maestro Live Run

Read-only/local preflight:

```bash
# Only after an approved caseplan.json exists:
uip maestro case validate "uipath/maestro/caseplan.json" --output json
uip maestro case process list --output json
```

Approved live debug/run:

```bash
# Only after an approved case project exists at this path:
uip maestro case debug "uipath/maestro" --folder-id 7986316 --output json
uip maestro case process run "<CASE_PROCESS_KEY>" \
  "4fba2fa1-012b-469a-b6aa-e5be3811c173" \
  --inputs '{"caseId":"TACC-2026-001","synthetic":true}' \
  --validate \
  --output json
```

Capture the Maestro case process key, instance/job ID, stage reached, and the
first UiPath-written event record.

### Action Center Task Creation

Read-only preflight:

```bash
uip tasks users 7986316 --output json
uip tasks list --folder-id 7986316 --output json
```

There is no direct `uip tasks create` command in the current local CLI surface.
Task creation must be triggered by an approved Maestro/HITL node, Action App, or
workflow implementation that binds one of the contracts in
`uipath/action-center/contracts/`.

Approved creation path:

```bash
# Trigger the approved Maestro/HITL or workflow step that creates exactly one
# synthetic clinician evidence, appeal signoff, or exception review task.
uip tasks list --folder-id 7986316 --output json
```

Capture the task ID, assigned reviewer or group, task type, and event mirror
record. Do not complete or reassign tasks unless that separate action is
approved.

### Data Service Or Data Fabric Writes

Read-only preflight:

```bash
uip df entities list --output json
```

The currently verified CLI is `uip` 1.195.x. Its local Data Fabric help does
not expose `--folder-key` or `--include-folders`; if folder-scoped Data Fabric
writes are approved, first update/install the Data Fabric tool version that
registers those flags, then rerun discovery before writing.

Approved entity discovery for the `TreatmentAccessHackathon` folder:

```bash
# Requires a Data Fabric CLI surface that exposes --folder-key.
uip df entities list \
  --folder-key "4fba2fa1-012b-469a-b6aa-e5be3811c173" \
  --output json
```

Approved record write shape, only after resolving the actual entity ID from
discovery and confirming the target entity is native and folder-scoped:

```bash
# Requires a Data Fabric CLI surface that exposes --folder-key.
uip df records insert "<TACC_AUDIT_EVENT_ENTITY_ID>" \
  --folder-key "4fba2fa1-012b-469a-b6aa-e5be3811c173" \
  --body '{"caseId":"TACC-2026-001","eventType":"case.created","actorType":"maestro","syntheticDataDisclaimer":"Synthetic demo data only. Not PHI. Not medical or legal advice."}' \
  --output json
```

Re-read after every approved write:

```bash
# Requires a Data Fabric CLI surface that exposes --folder-key.
uip df records list "<TACC_AUDIT_EVENT_ENTITY_ID>" \
  --folder-key "4fba2fa1-012b-469a-b6aa-e5be3811c173" \
  --limit 10 \
  --output json
```

### Orchestrator Robot Job Start

Read-only preflight:

```bash
uip or processes list --folder-path "TreatmentAccessHackathon" --output json
uip or folders runtimes "TreatmentAccessHackathon" --output json
uip or sessions attended list --folder-path "TreatmentAccessHackathon" --output json
```

Approved job start:

```bash
uip or jobs start "<PAYER_PORTAL_FALLBACK_PROCESS_KEY>" \
  --folder-path "TreatmentAccessHackathon" \
  --runtime-type Development \
  --jobs-count 1 \
  --input-arguments '{"caseId":"TACC-2026-001","portalUrl":"http://127.0.0.1:5174","synthetic":true}' \
  --wait-for-completion \
  --timeout 300 \
  --output json
```

Capture the job key, robot runtime, portal confirmation ID, and UiPath-written
`payer.portal.submitted` event.

### Solution Lifecycle

Safe preflight:

```bash
uip solution project list \
  --solution-folder "uipath/solution/treatment-access-command-center" \
  --output json
uip solution resource refresh \
  --solution-folder "uipath/solution/treatment-access-command-center" \
  --output json
scripts/uipath-with-dotnet8.sh uip solution pack \
  "uipath/solution/treatment-access-command-center" \
  --dry-run \
  --output json
```

Approved upload/publish/deploy/activate:

```bash
uip solution upload "uipath/solution/treatment-access-command-center" --output json
uip solution pack "uipath/solution/treatment-access-command-center" --output json
uip solution publish "uipath/solution/treatment-access-command-center" --output json
uip solution deploy run "<SOLUTION_PACKAGE_KEY>" \
  --parent-folder-key "4fba2fa1-012b-469a-b6aa-e5be3811c173" \
  --output json
uip solution deploy activate "<DEPLOYMENT_ID>" --output json
```

Capture package version, deployment ID, activation status, and any deployment
configuration key used.

## Handoff Checklist

Before the orchestrator approves any live side effect, confirm:

- `CI=true pnpm uipath:readiness` has passed or the failing discovery layer is
  documented.
- Provider/workflow lanes have merged the final runtime contracts.
- UI lane reads UiPath-written state only for live mode.
- `TreatmentAccessHackathon` is the selected folder.
- All payloads use synthetic `TACC-*`/`AVFH-PORTAL-SYN-*` data.
- The operator knows exactly which single approval-gated block is being run.
