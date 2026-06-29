# Checkpoint 8 Lane Handoff: Cloud Discovery

Lane: Cloud Discovery, Permissions, and Approval Matrix
Date: 2026-06-29
Folder: `TreatmentAccessHackathon`
Folder ID: `7986316`
Folder key: `4fba2fa1-012b-469a-b6aa-e5be3811c173`

## Files Changed

- `docs/checkpoint-8-live-proof-approval-matrix.md`
- `docs/checkpoint-8-lane-handoffs/cloud-discovery.md`
- `scripts/verify-checkpoint8-uipath-discovery.ts`

No app, service, package, robot, or solution runtime files were changed.

## Read-Only Commands Run

UiPath skill docs read first:

- `AGENTS.md`
- `docs/checkpoint-8-live-uipath-final-orchestrator.md`
- `docs/live-uipath-final-execution-plan.md`
- `docs/AGENT_MEMORY.md`
- `docs/orchestration-log.md`
- `/Users/abhinavgupta/Desktop/UiPath/Treatment Access/.agents/skills/uipath-skill-catalog/SKILL.md`
- `/Users/abhinavgupta/Desktop/UiPath/Treatment Access/.agents/skills/uipath-platform/SKILL.md`
- `/Users/abhinavgupta/Desktop/UiPath/Treatment Access/.agents/skills/uipath-tasks/SKILL.md`
- `/Users/abhinavgupta/Desktop/UiPath/Treatment Access/.agents/skills/uipath-solution/SKILL.md`
- `/Users/abhinavgupta/Desktop/UiPath/Treatment Access/.agents/skills/uipath-agents/SKILL.md`

Read-only discovery commands:

- `uip --version`
- `uip login status --output json`
- `uip login tenant list --output json`
- `uip tools list --output json`
- `uip solution init --help --output json`
- `uip solution --help`
- `uip solution deploy --help`
- `uip agent --help`
- `uip agent list --output json`
- `uip codedagent --help`
- `uip df --help`
- `uip df entities list --output json`
- `uip df entities list --include-folders --output json`
- `uip df choice-sets list --output json`
- `uip or --help`
- `uip or folders get TreatmentAccessHackathon --output json`
- `uip or folders runtimes TreatmentAccessHackathon --output json`
- `uip or machines list --folder-path TreatmentAccessHackathon --all-fields --output json`
- `uip or sessions attended list --folder-path TreatmentAccessHackathon --output json`
- `uip or sessions unattended list --folder-path TreatmentAccessHackathon --output json`
- `uip or processes list --folder-path TreatmentAccessHackathon --output json`
- `uip or releases list --folder-path TreatmentAccessHackathon --output json`
- `uip or jobs list --folder-path TreatmentAccessHackathon --output json`
- `uip or packages list --folder-path TreatmentAccessHackathon --output json`
- `uip or packages list --search Treatment --output json`
- `uip or packages list --search PayerPortalFallback --output json`
- `uip solution packages list --output json`
- `uip solution project list --solution-folder uipath/solution/treatment-access-command-center --output json`
- `uip tasks list --help`
- `uip tasks users 7986316 --output json`
- `uip tasks list --folder-id 7986316 --output json`

The `--include-folders`, `or releases`, and `or packages --folder-path` probes
were intentionally read-only command-surface checks. They failed validation
without mutating state and are documented in the matrix.

## Discovery Results

- CLI version: `1.195.1`.
- Login: active for organization `galacticus`, tenant `DefaultTenant`.
- Folder: `TreatmentAccessHackathon` exists with ID `7986316`, key
  `4fba2fa1-012b-469a-b6aa-e5be3811c173`, type `Standard`, fine-grained
  permissions.
- Registered tools: `solution`, `agent`, `codedagent`, `codedapp`, `is`, `or`,
  `rpa`, `tm`, `resource`, `api-workflow`, `maestro`, `admin`, `df`, and
  `tasks`.
- Runtimes: `Development` total `1`, connected `1`, available `1`. `Serverless`
  and `ServerlessTestAutomation` total `1` each but connected/available `0`.
  `Unattended`, `AgentService`, `CaseManagement`, and `Flow` total `0`.
- Machines/sessions: personal workspace and default serverless machine templates
  are assigned. One available Assistant session is visible. Personal
  name/email/host details are redacted from this handoff.
- Orchestrator: no processes, no jobs, and no matching `Treatment` or
  `PayerPortalFallback` packages are listed.
- Solution: local solution inventory contains `PayerPortalFallback` as a
  `Process` project. No published solution packages are listed.
- Action Center: one assignable user is visible; no tasks are currently listed
  for folder `7986316`.
- Data Fabric/Data Service: `df` surface is present. No entities or choice sets
  are listed.
- Agent surfaces: low-code and coded agent command surfaces are present.
  `uip agent list --output json` reports no Studio Web solutions found.

## Blockers and Limits

- H1 live UiPath-written event state is not present yet. Data Fabric is reachable
  but has no entity; Orchestrator has no process/package; Studio Web has no
  listed agent solution.
- H2 live Action Center proof is not present yet. Read/list/user discovery works,
  but no task exists and no task-create CLI command was discovered.
- H3 robot proof is not present yet. The local `PayerPortalFallback` project is
  registered in the local solution, but no package/process/job exists in Cloud.
- `uip or releases list` is not available in CLI `1.195.1`; use
  `uip or processes list` for runnable process bindings.
- `uip or packages list` is tenant-scoped and does not accept `--folder-path`.
- `uip df entities list --include-folders` is not supported by this CLI surface.

## Approval Needed Before Live Execution

The orchestrator must get explicit user approval before running any of:

- `uip df entities create/update/delete ...`
- `uip df records insert/update/delete ...`
- `uip api-workflow run ...`
- `uip maestro case debug/run ...`
- `uip maestro flow debug/run ...`
- `uip agent run/debug/publish/deploy/push/pull/migrate/share ...`
- `uip codedagent run/debug/invoke/publish/deploy/push/pull/register/add ...`
- any UiPath workflow/agent/UI action that creates an Action Center task
- `uip tasks assign/reassign/unassign/complete ...`
- `uip or jobs start/stop ...`
- `uip or queue-items add ...`
- `uip or packages upload ...`
- `uip or processes create/update/delete ...`
- `uip rpa run/debug ...`
- UiPath Assistant run of `PayerPortalFallback`
- `uip solution resource refresh ...`
- `uip solution upload/publish/deploy run/deploy activate/deploy uninstall ...`
- real payer submission or use of real payer/provider credentials

The detailed matrix with reset notes is in
`docs/checkpoint-8-live-proof-approval-matrix.md`.

## Integration Notes

- The Event State/Data Service lane should treat Data Fabric entity creation and
  record insertion as approval-gated H1, not as already-available infrastructure.
- The Action Center lane can rely on `uip tasks users 7986316` and
  `uip tasks list --folder-id 7986316` as safe read-only checks. It still needs
  an approved task creation path through UiPath workflow/agent/UI because this
  CLI exposes no `uip tasks create` command.
- The RPA lane should not assume a Cloud process exists. It must publish/deploy
  or use Assistant only after approval, then verify with
  `uip or processes list`, `uip or jobs list`, and the governed event path.
- The final proof should claim at most "ready for live UiPath execution" until
  H1 is actually performed and a UiPath-written synthetic event ID is captured.

## Verification

Run by this lane:

- `node scripts/verify-checkpoint8-uipath-discovery.ts`
- `CI=true pnpm verify:setup`
- `git diff --check`
