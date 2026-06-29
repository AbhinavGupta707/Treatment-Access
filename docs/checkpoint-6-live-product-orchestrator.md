# Checkpoint 6 - Live Product UI And Agentic Runtime

## Objective

Turn the current local proof into a polished, customer-facing live product:

- reference-image-inspired dark SaaS UI;
- runnable case workflow from the UI;
- Fireworks-backed model calls;
- LangSmith traces;
- schema-validated agent outputs;
- clear UiPath orchestration and governance boundaries;
- no real PHI, no uncontrolled payer submission, and no unapproved live UiPath
  side effects.

## Integration Branch

`main`

## Required Reading

- `AGENTS.md`
- `docs/live-agentic-product-plan.md`
- `docs/architecture.md`
- `docs/fixture-contracts.md`
- `uipath/agents/contracts/agent-contracts.json`
- `uipath/data-service/event-mirror-contract.md`
- `design-system/treatment-access-command-center/MASTER.md`

## Proposed Lanes

### Lane 1 - Product UI Redesign

Ownership:

- `apps/command-center/src/main.tsx`
- `apps/command-center/src/styles.css`
- `apps/command-center/src/lib/*`

Deliverables:

- Routed product UI or equivalent route-state navigation:
  - dashboard;
  - cases;
  - case detail;
  - evidence matrix;
  - submission status;
  - appeal builder;
  - analytics placeholder with real synthetic KPIs.
- Dark navy visual system aligned with `/Ui References`.
- Existing proof details moved to audit/trace drawer or secondary demo view.
- Responsive checks at 375, 768, 1024, 1440.

Checks:

- `CI=true pnpm --filter @tacc/command-center typecheck`
- `CI=true pnpm --filter @tacc/command-center build`
- browser smoke of dashboard, case detail, evidence, and appeals pages.

### Lane 2 - Live Agent Provider And Schemas

Ownership:

- `packages/agent-runtime`
- `packages/shared-schemas`
- `services/mock-healthcare-api`
- root scripts/env docs as needed

Deliverables:

- `AGENT_MODE=deterministic|live`.
- Fireworks OpenAI-compatible client adapter.
- LangSmith tracing adapter.
- Environment validation that fails clearly when live keys are missing.
- Runtime schemas for `AgentRun`, `AgentStepRun`, `ToolCall`,
  `HumanGate`, `RobotJob`, `SubmissionAttempt`, and `TraceLink`.
- Existing deterministic smoke tests still pass.

Checks:

- `CI=true pnpm --filter @tacc/shared-schemas test`
- `CI=true pnpm --filter @tacc/agent-runtime test`
- `CI=true pnpm smoke:agents`

### Lane 3 - LangGraph Multi-Agent Workflow

Ownership:

- `packages/agent-runtime`
- optional new `packages/live-agent-runtime`
- scripts for live smoke

Deliverables:

- Seven specialist nodes with distinct prompts, tools, and structured outputs.
- Policy/evidence retrieval with Fireworks embeddings/reranker where useful.
- Branching:
  - missing evidence -> human gate;
  - clinician signoff rejected -> rework;
  - payer API unavailable -> robot fallback request;
  - denial -> appeal flow;
  - approval -> care handoff.
- Stream or poll progress events for the UI.
- LangSmith trace ID captured per run.

Checks:

- deterministic graph smoke;
- live no-side-effect smoke with `AGENT_MODE=live` when keys are present;
- output validation against shared schemas.

### Lane 4 - UiPath Live Wiring Plan And Safe Hooks

Ownership:

- `uipath/agents`
- `uipath/api-workflows`
- `uipath/data-service`
- `uipath/action-center`
- `uipath/robots`
- docs

Deliverables:

- Decide whether the live runtime is packaged as:
  - a UiPath Coded Agent with LangGraph; or
  - local service invoked by UiPath API Workflow during the demo.
- If creating a new Coded Agent, use `uip codedagent new`; do not hand-author
  the project shell.
- Add safe hooks/stubs for:
  - Action Center task creation;
  - Data Service/Data Fabric write;
  - Orchestrator robot fallback request;
  - solution pack/publish/deploy readiness.
- Document exact approval-gated live commands.

Checks:

- `uip` validation/pack commands that do not create live side effects;
- no live writes or job starts unless the user explicitly approves.

### Lane 5 - Live Demo QA And Submission Proof

Ownership:

- `scripts`
- `docs/demo-script.md`
- `docs/submission.md`
- `uipath/screenshots`

Deliverables:

- One-command local demo runner or clear terminal workflow.
- Live-mode readiness script that checks env vars, model connectivity, and
  tracing availability without touching real UiPath side effects.
- Browser smoke that proves the redesigned UI is readable and interactive.
- Updated demo script that verbally explains the backend while the screen stays
  product-clean.

Checks:

- `CI=true pnpm verify`
- `CI=true pnpm format:check`
- `CI=true pnpm seed`
- `CI=true pnpm smoke:checkpoint4 -- --port 8894`
- `CI=true pnpm smoke:agents`
- new live readiness command, no-side-effect mode
- `git diff --check`

## Merge Order

1. Live Agent Provider And Schemas
2. LangGraph Multi-Agent Workflow
3. Product UI Redesign
4. UiPath Live Wiring Plan And Safe Hooks
5. Live Demo QA And Submission Proof

The UI can be developed in parallel, but should merge after the new runtime
contracts are stable.

## Hard Gates

Do not run without explicit user approval:

- live `uip agent debug`;
- live Maestro debug/run;
- Action Center task creation;
- Data Service/Data Fabric record writes;
- Orchestrator job start;
- RPA live run/debug;
- solution upload/publish/deploy/activate;
- any real payer submission.

## Done Criteria

Checkpoint 6 is complete when:

- The main Command Center no longer looks like a proof dashboard.
- A user can start or replay a synthetic case run from the UI.
- In deterministic mode, the run is repeatable and all checks pass.
- In live mode, Fireworks model calls execute and produce schema-valid agent
  outputs.
- LangSmith trace IDs are captured and visible in an audit drawer or run detail.
- UiPath live steps are either executed with explicit approval and documented,
  or clearly marked as approval-gated with no overclaiming.
- The demo can be narrated as a real product flow while backend complexity is
  visible only on drill-down.
