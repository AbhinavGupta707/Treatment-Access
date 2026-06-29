# Checkpoint 7 Live UiPath Proof Plan

## Purpose

Checkpoint 7 turns the Checkpoint 6 product shell into a narrow, judge-ready
live proof. The goal is not to build a full production deployment. The goal is
to prove, with synthetic data and clear evidence, that a user can start a
treatment-access case run, live agents can reason over the case, and UiPath can
remain the orchestration and governance layer for human gates, robots, and
auditable state.

## Critical Analysis

Checkpoint 6 solved the demo-visible product problem: the Command Center now
looks like a premium customer product rather than an internal proof dashboard.
It also added Fireworks and LangSmith readiness, a LangGraph-shaped seven-agent
runtime, and UiPath no-side-effect readiness checks.

The remaining gap is source-of-truth credibility. Today, the UI can display
deterministic mirrored state and the repo can prove live provider connectivity,
but the judge-facing flow still needs one product action that creates a live
run, executes agent work, and mirrors new governed events into the Command
Center. Without that, the story can feel like a polished walkthrough rather
than a working agentic automation product.

Official UiPath docs shape the design:

- Maestro is the orchestration layer for automation, AI agents, and humans,
  including long-running and exception-heavy case work.
- UiPath Agents can be low-code or coded. Coded agents can use Python and
  LangGraph, deploy through Orchestrator, use Action Center interrupts, and
  participate in UiPath governance.
- Action Center is the human-in-the-loop gate for robot workflows that need
  human input before continuing.
- Data Service is the governed persistent store for long-running automation
  state.
- Orchestrator jobs are the governed execution records for robots, agents, and
  processes.

Checkpoint 7 should therefore focus on a minimal end-to-end proof slice:

```text
Command Center "Run live proof"
  -> Treatment Access API creates a live proof run record
  -> Fireworks-backed agent runtime executes the seven-agent graph
  -> LangSmith trace metadata or trace URL is captured when available
  -> UiPath-safe synthetic event records are written to the event mirror
  -> Command Center shows live run progress, trace evidence, and source labels
  -> Optional approved UiPath side effects create stronger proof:
       Action Center task, Data Service record, Coded Agent or Agent Builder run,
       Maestro run, Orchestrator robot job, or solution deploy evidence
```

## Success Criteria

- A user can start a synthetic live proof run from the Command Center.
- The backend exposes a live proof endpoint or script that runs the agent graph
  in `AGENT_MODE=live` with Fireworks model calls and schema-validated outputs.
- LangSmith trace configuration is connected to the run. If a trace URL is
  available, the run stores and displays it. If only metadata is available, the
  UI says that honestly.
- The run writes synthetic event records for the visible flow stages:
  `case_live_proof_started`, `policy_checked`, `evidence_mapped`,
  `human_gate_required`, `submission_packet_ready_or_blocked`,
  `payer_api_unavailable_or_not_attempted`, and
  `live_proof_completed_or_waiting_for_approval`.
- The UI can refresh and show live run status, current agent, next human gate,
  source citations, and whether the state came from Fireworks, LangSmith, a
  UiPath record, or a deterministic fallback.
- All clinical assertions remain source-backed, policy-cited, or blocked behind
  human approval.
- All live UiPath side effects remain explicit-approval gated.
- A new Checkpoint 7 smoke proves the live proof contract without printing
  secrets.

## Non-Goals

- No real patient, provider, payer, credential, or personal health data.
- No real payer submission.
- No autonomous medical or legal advice.
- No hidden Action Center, Data Service, Orchestrator, Maestro, solution, IXP,
  robot, or payer side effects.
- No claim that the custom UI is the source of truth. It visualizes governed
  events and live run metadata.

## Live Approval Gates

These actions must not be run unless the user gives explicit approval in this
orchestrator thread:

- `uip agent debug` or any live agent run/debug command.
- Maestro run/debug.
- Action Center task creation, assignment, or completion.
- Data Service/Data Fabric writes.
- Orchestrator job start.
- RPA run/debug or UiPath Assistant robot execution.
- Solution upload, publish, deploy, or activate.
- IXP mutation.
- Payer submission.

Read-only discovery, local validation, dry-runs, local builds, and no-side-
effect readiness checks are allowed.

## Planned Work Slices

### A. Live Proof Schemas, API, and Agent Runtime

Add a run contract for `LiveProofRun`, `LiveProofStep`, `LiveProofTrace`,
`LiveProofApprovalGate`, and `UiPathEvidenceRef`. Expose a backend route or
script to create a run, execute the existing agent graph in live mode, validate
outputs, and write synthetic events into the mirror.

### B. UiPath Coded Agent and Governed Hooks

Create or harden the UiPath-side live proof wrapper so the same run contract can
be invoked by a Coded Agent or Agent Builder path later. Add no-side-effect
discovery/readiness for Action Center, Data Service, Maestro, Orchestrator job,
RPA, and Solution lifecycle hooks. Keep every side-effect command documented and
approval-gated.

### C. RPA Portal Fallback Live-Smoke Hardening

Complete the synthetic payer portal fallback proof so the UI and mock portal can
show the difference between API unavailable, robot requested, and confirmation
received. The default remains local/no-side-effect unless the user approves a
live robot run or Orchestrator job.

### D. Command Center Live Proof UX

Make the premium UI product-clear: the user sees one obvious "Run live proof"
action, live progress, what the agents just did, what requires clinician
approval, and what time is saved. Avoid technical clutter on the main surface;
put provider/runtime evidence in detail drawers.

### E. QA, Demo, and Submission Readiness

Add `smoke:checkpoint7-live-proof`, update demo/submission docs, and verify no
screen or document overclaims live UiPath side effects. The demo script should
explain business value first: fewer denials, fewer manual chart reviews, faster
prior authorization, and safer appeals.

## Verification Target

After Checkpoint 7 lanes merge, run:

```bash
CI=true pnpm verify
CI=true pnpm format:check
CI=true pnpm verify:checkpoint6
CI=true pnpm smoke:agents
CI=true pnpm smoke:checkpoint6-live-providers
CI=true pnpm smoke:live-agents -- --require-live --call-model
CI=true pnpm smoke:checkpoint6-ui
CI=true pnpm smoke:checkpoint7-live-proof
CI=true pnpm uipath:readiness local
git diff --check
```

If a live provider or UiPath credential is unavailable, record exactly which
check could not run and which narrower deterministic or read-only check passed.

## Optional Approved Live Proof Commands

These examples are documentation only. Do not run them without explicit user
approval:

```bash
uip agent debug ...
uip tasks list --folder-id 7986316 --output json
uip df records list ... --folder-key 4fba2fa1-012b-469a-b6aa-e5be3811c173 --output json
uip or jobs start ... --output json
uip solution upload ...
uip solution publish ...
uip solution deploy ...
```

## Sources Checked

- UiPath Maestro overview:
  https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/overview
- UiPath Action Center introduction:
  https://docs.uipath.com/action-center/automation-cloud/latest/user-guide/introduction
- UiPath Data Service introduction:
  https://docs.uipath.com/data-service/automation-cloud/latest/user-guide/introduction
- UiPath Agent capabilities:
  https://docs.uipath.com/agents/automation-cloud/latest/user-guide/agent-capabilities-in-the-uipath-platform
- UiPath coded agents:
  https://docs.uipath.com/agents/automation-cloud/latest/user-guide/about-coded-agents
- UiPath Orchestrator jobs:
  https://docs.uipath.com/orchestrator/automation-cloud/latest/user-guide/about-jobs
