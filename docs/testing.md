# Testing

Run the local verification suite:

```bash
CI=true pnpm verify
```

Run focused checks:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm verify:setup
```

## Checkpoint 1 Local Smoke

Install dependencies if this worktree has not been bootstrapped yet:

```bash
CI=true pnpm install
```

Run the setup and formatting gates:

```bash
CI=true pnpm verify:setup
CI=true pnpm format:check
```

Run the full Checkpoint 1 smoke. This command builds shared contracts, starts
the mock healthcare API on `http://127.0.0.1:8787` when needed, verifies health,
reset, seeded state, toggles, payer behavior, event ingestion/listing, and then
returns the runtime to a clean seed state:

```bash
CI=true pnpm smoke:checkpoint1
```

## Checkpoint 3 Agent Runtime Smoke

Run the deterministic local agent runtime smoke. This does not call live UiPath
Agent Builder, Maestro, Action Center, Data Service, or payer endpoints. It
validates the seven shared agent contracts, trace/audit payload envelopes,
missing-safety-lab submission blocking, denial-reason strategy branching,
clinician-review appeal constraints, and unsupported-claim warnings:

```bash
CI=true pnpm smoke:agents
```

## Checkpoint 6 Live Agent Readiness

The runtime now supports `AGENT_MODE=deterministic|live`. Deterministic mode is
the default and does not require provider keys. Live mode validates provider
configuration without printing raw secret values:

```bash
AGENT_MODE=live \
FIREWORKS_API_KEY=... \
LANGSMITH_TRACING=true \
LANGSMITH_API_KEY=... \
CI=true pnpm smoke:live-agents
```

By default this readiness smoke has no external side effects and does not call a
model. To additionally make a tiny Fireworks chat-completions call, opt in
explicitly:

```bash
AGENT_MODE=live LIVE_AGENT_READINESS_CALL_MODEL=true CI=true pnpm smoke:live-agents
```

or:

```bash
AGENT_MODE=live CI=true pnpm smoke:live-agents -- --call-model
```

The command never calls live UiPath, payer, Action Center, Orchestrator, Data
Service, or robot APIs. It only checks local env/config state unless the
Fireworks model call is explicitly enabled.

## Checkpoint 6 LangGraph Workflow Runtime

`@tacc/agent-runtime` now exposes a graph-shaped workflow runner:

- `getTreatmentAccessGraphDefinition()` returns the LangGraph node/edge
  definition and branch labels.
- `createTreatmentAccessLangGraph()` compiles the LangGraph skeleton.
- `runTreatmentAccessGraph()` runs the no-side-effect workflow and returns
  validated graph steps, structured tool results, human gates, submission
  attempts, robot fallback requests, audit metadata, and LangSmith-ready trace
  metadata.

The package adds the minimal LangGraph dependency:

```bash
pnpm --filter @tacc/agent-runtime add @langchain/langgraph@1.4.7
```

Deterministic mode remains the default and requires no API keys:

```bash
CI=true pnpm --filter @tacc/agent-runtime test
CI=true pnpm smoke:agents
```

Live mode is intentionally adapter-shaped. Pass a provider implementing
`TreatmentAccessStructuredProvider` so the runtime can call Fireworks through
the provider/schema lane once available. Without a provider, the runner remains
safe and deterministic-shaped. LangSmith fields are included as trace metadata;
the deterministic tests do not call LangSmith.

The graph models these governed branches without live UiPath side effects or
real payer submission:

- missing evidence -> human gate;
- clinician rejection -> rework/block;
- payer API unavailable -> robot fallback request, no Orchestrator job start;
- denial -> denial rescue and appeal packet with clinician signoff gate;
- approval -> care continuity handoff.

## Checkpoint 8 Final UiPath Readiness

Run the final no-side-effect readiness smoke before the five-minute recording
and Devpost submission:

```bash
CI=true pnpm smoke:checkpoint8-live-uipath
```

The smoke verifies the final Command Center proof manifest and documentation
boundaries. It checks for the `TreatmentAccessHackathon` folder, folder ID
`7986316`, folder key `4fba2fa1-012b-469a-b6aa-e5be3811c173`, event/record ID,
task ID, job ID, confirmation ID, source labels, timestamp, and safety status
fields. It also confirms local synthetic proof, live provider proof, and Live
UiPath Proof are worded separately.

This smoke does not create Action Center tasks, Data Service records,
Orchestrator jobs, deployments, robot runs, or payer submissions. If no live
UiPath side-effect has run, the UI and docs must say "ready for live UiPath
proof" instead of claiming completed live execution.

## Checkpoint 4 Mock Payer Portal

Run the local mock payer portal for RPA fallback development:

```bash
CI=true pnpm --filter @tacc/mock-payer-portal typecheck
CI=true pnpm --filter @tacc/mock-payer-portal build
pnpm dev:mock-payer
```

The portal runs on `http://127.0.0.1:5174` by default and uses synthetic seeded
defaults only. Stable selectors are available on the form, member ID,
medication, diagnosis, payer, case ID, order ID, evidence fields, submit button,
confirmation ID, and submission status.

When the mock API `payer_api_unavailable` toggle is true, direct prior-auth
requests with `channel: "api"` still return `PAYER_API_DOWN`; fallback requests
with `channel: "portal_fallback"` submit successfully and return a
deterministic `AVFH-PORTAL-SYN-*` confirmation.

Browser-only portal submission shows the local receipt state for robot capture;
it does not write live UiPath or payer state by itself.

## Checkpoint 4 Fallback Smoke

Run the deterministic local fallback proof. This builds shared contracts, the
mock healthcare API, the Command Center, and the Mock Payer Portal, then starts
the mock API on `http://127.0.0.1:8789` and verifies the Checkpoint 4 story as
far as possible without live UiPath side effects:

```bash
CI=true pnpm smoke:checkpoint4
```

The smoke checks:

- clean reset through `POST /demo/reset`;
- payer API unavailable behavior through `payer_api_unavailable=true`;
- the `api_failure_portal_fallback` secondary stage in `/demo/state`;
- `portal_fallback` submission success when the current API supports it;
- robot fallback event ingestion through `POST /events`;
- Command Center-visible runtime state through `/demo/state`;
- built static artifacts at `apps/command-center/dist` and
  `apps/mock-payer-portal/dist`.

If another local process is using the default port, choose a port explicitly:

```bash
CI=true pnpm smoke:checkpoint4 -- --port 8894
```

Expected result after Checkpoint 4 integration: direct `channel: "api"`
submissions return unavailable under the API-down toggle, while
`channel: "portal_fallback"` succeeds without a skipped limitation. A skipped
portal fallback check indicates the mock API contract has regressed.

This smoke uses synthetic data only. It does not run `uip rpa`, start an
Orchestrator job, create Action Center tasks, write Data Service records, upload
solutions, or submit to any real payer system.

## Checkpoint 4 Manual Browser QA

Use three terminals from the repo root.

Terminal 1, mock healthcare API:

```bash
CI=true pnpm dev:api
```

Expected API URL: `http://127.0.0.1:8787`.

Terminal 2, Command Center:

```bash
CI=true pnpm dev:command-center
```

Open `http://127.0.0.1:5173`.

Terminal 3, Mock Payer Portal:

```bash
CI=true pnpm dev:mock-payer
```

Open `http://127.0.0.1:5174`.

Command Center checks:

- the top status chip says `Live event mirror`;
- the case queue shows `TACC-2026-001` and synthetic patient data only;
- click reset and confirm the evidence matrix returns to the clean seed state;
- turn on `Payer API unavailable` and confirm the API failure to portal robot
  panel shows the unavailable payer API side and awaits a robot/portal event;
- after a robot or smoke event is written, filter the timeline to `Robot` and
  confirm `portal_fallback_submitted` appears;
- no screen asks for real patient, payer, provider, credential, or personal
  health data.

Mock Payer Portal checks:

- the portal opens on `Northstar Health Plan Prior Authorization Portal`;
- the form contains synthetic defaults only;
- submit the form and confirm the page shows `Submission received` and
  confirmation ID `AVFH-PORTAL-SYN-001`;
- this browser-only portal submit does not write live UiPath state by itself.

If the Command Center cannot reach the API, diagnose in layer order:

1. Confirm the mock API is registered and running at `http://127.0.0.1:8787`.
2. Confirm `/health` returns `ok=true`.
3. Confirm `/demo/state` returns the seed case.
4. Only then debug browser CORS, runtime, or permission issues.

## Checkpoint 4 Live UiPath Approval Gates

These actions have real live side effects and require explicit approval from
the orchestrator or user before running:

- RPA run/debug: `uip rpa run`, `uip rpa debug`, Studio Web debug, or Assistant
  robot execution against the portal.
- Orchestrator job start: `uip or jobs start` or any equivalent job launch.
- Solution mutation: solution upload, publish, deploy, or deploy activation.
- Action Center task creation: any command or workflow that creates live tasks.
- Data Service writes: entity creation, updates, deletes, or workflow writes to
  the UiPath tenant.
- Payer submission: any live workflow step that submits a prior authorization,
  appeal, or portal packet outside the local synthetic mock.

## Checkpoint 6 Live Product Readiness

Checkpoint 6 readiness is split into three layers so the demo can prove live
capabilities without overclaiming UiPath side effects.

### Deterministic Local Smoke

Run this first on every merged build:

```bash
CI=true pnpm verify:checkpoint6
CI=true pnpm smoke:agents
CI=true pnpm smoke:checkpoint4 -- --port 8894
git diff --check
```

`verify:checkpoint6` runs the static submission-readiness gate and
`smoke:checkpoint6-readiness`. The Checkpoint 6 readiness script checks that
the docs separate local proof, live provider proof, and approval-gated UiPath
steps; confirms the product-first demo script; verifies package command
registration; validates live env shape without printing values; scans tracked
text files for likely committed secrets; and confirms no live UiPath side
effect was attempted.

### UiPath Live Readiness

Run the safe UiPath readiness wrapper before requesting live smoke approval:

```bash
CI=true pnpm uipath:readiness
```

This performs command-surface discovery, read-only cloud discovery, RPA
validate/build, and solution pack dry-run. It does not run Agent Builder/Coded
Agent jobs, Maestro debug/run, Action Center task creation, Data Service writes,
Orchestrator job starts, RPA run/debug, solution upload/publish/deploy/activate,
or payer submission.

If cloud access is unavailable, run the local subset and document the cloud
dependency:

```bash
CI=true pnpm uipath:readiness -- local
```

The approval-gated live command blocks are maintained in
`uipath/live-wiring-runbook.md`.

### UI Page Smoke

After the Command Center lane is merged and a local app server is running, use:

```bash
CI=true pnpm dev:command-center
CI=true pnpm smoke:checkpoint6-ui
```

The UI smoke checks the app shell at `/`, `/dashboard`, `/cases`, and
`/analytics` through `TACC_COMMAND_CENTER_URL` or
`http://127.0.0.1:5173` by default. It is a navigation/page availability smoke,
not a live UiPath or payer test.

### Fireworks/LangSmith No-Side-Effect Smoke

After `.env.local` contains live provider credentials, run:

```bash
CI=true pnpm smoke:checkpoint6-live-providers
```

The script reads `.env.local` only to check key presence and authenticate
read-only provider calls. It never prints `.env.local` values. The Fireworks
check calls the OpenAI-compatible `/models` endpoint and does not run
inference. The LangSmith check reads sessions/projects and does not create a
trace. A demo may claim live LLM/provider readiness only after this command
passes or equivalent evidence is captured.

Expected live provider variables:

```bash
AGENT_MODE=live
FIREWORKS_API_KEY=
FIREWORKS_BASE_URL=https://api.fireworks.ai/inference/v1
FIREWORKS_AGENT_MODEL=
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=
```

Optional:

```bash
LANGSMITH_ENDPOINT=
LANGSMITH_WORKSPACE_ID=
```

### Approval-Gated UiPath Live Side Effects

Do not run these from the readiness lane without explicit approval and a plan
for recording evidence:

- live `uip agent debug`, Agent Builder run/debug, or Coded Agent run/debug;
- Maestro debug/run or case start;
- Action Center task creation;
- Data Service/Data Fabric writes;
- Orchestrator robot job start, Assistant robot execution, or RPA debug/run;
- solution upload, publish, deploy, or activation;
- any payer submission outside the local synthetic mock.

If a live UiPath feature is missing or unavailable, diagnose in layer order:
confirm registration, discovery/install state, and official activation flow
first; only debug permissions or runtime after the feature is present.

## Checkpoint 5 Final QA

Run the final non-live setup and repository checks from a clean worktree:

```bash
CI=true pnpm verify:setup
CI=true pnpm format:check
CI=true pnpm verify:submission-readiness
git diff --check
```

Run the strongest local deterministic smokes available before recording or
submitting the demo:

```bash
CI=true pnpm seed
DEBUG_SMOKE=1 CI=true pnpm smoke:checkpoint1 -- --port 8878
CI=true pnpm smoke:agents
DEBUG_SMOKE=1 CI=true pnpm smoke:checkpoint4 -- --port 8894
```

These commands use synthetic data only. They do not run live UiPath RPA,
Orchestrator jobs, solution upload/publish/deploy/activate, Agent Builder
debug, Maestro debug, Action Center task creation, Data Service writes, IXP
mutation, or payer submission.

### Local Reset

Before every recorded demo pass:

1. Run `CI=true pnpm seed` to rebuild and inspect the deterministic fixture.
2. Start the mock API and run `node --import tsx/esm scripts/reset-demo.ts --json`
   against the demo API if a server is already running.
3. Confirm `GET /demo/state` returns `case-syn-001`, zero submissions, and
   `payer_api_unavailable=false`.
4. Open the Command Center and confirm the case queue shows the synthetic case
   `TACC-2026-001`.

### Browser QA

Use local browser evidence for the custom apps:

```bash
CI=true pnpm dev:api
CI=true pnpm dev:command-center
CI=true pnpm dev:mock-payer
```

Capture Command Center proof at `http://127.0.0.1:5173` after reset. The proof
should show `Live event mirror`, synthetic case data, evidence matrix rows,
agent traces, Action Center gates, and the mocked-vs-live boundary.

Capture Mock Payer Portal proof at `http://127.0.0.1:5174` after submitting the
default synthetic form. The proof should show `Submission received`,
confirmation `AVFH-PORTAL-SYN-001`, and the warning that no real patient,
provider, payer, credential, or health data may be entered.

Store final evidence under `uipath/screenshots` and update
`uipath/screenshots/manifest.md` with the exact command or manual path used for
each capture.

### Privacy And Safety Scan

Review submission-facing text and screenshots before handoff:

```bash
rg -n "real patient|real PHI|SSN|DOB|MRN|policyholder|credential|password|medical advice|legal advice" README.md docs uipath apps packages services scripts
CI=true pnpm verify:submission-readiness
```

Expected result: only synthetic-data warnings, fixture IDs, and safety
boundaries appear. Do not add real patient, payer, provider, credential, or
personal health data. Appeal content must remain an administrative draft for
clinician review and must say it is not autonomous medical or legal advice.

### Mocked-Vs-Live Disclosure

Before the submission is called complete, confirm the docs and screenshots make
these boundaries visible:

- Local synthetic proof: Command Center rendering, mock healthcare API state,
  mock payer portal receipt, deterministic smoke tests, and event mirror data.
- Live UiPath proof: only captures performed in the `TreatmentAccessHackathon`
  folder after explicit approval.
- Manual live gaps: Maestro Case, Action Center, Orchestrator, Agent Builder,
  Data Service, solution deployment, and RPA robot run screenshots remain manual
  capture requirements until the user approves those account/browser actions.

### Live UiPath Approval Gates

Do not run these during final QA without explicit approval:

- `uip rpa run`, `uip rpa debug`, Studio Web debug, Assistant robot execution,
  or Orchestrator job start.
- `uip solution upload`, publish, deploy, or activate.
- Agent Builder debug/run, Maestro debug/run, IXP mutation, Action Center task
  creation, or Data Service writes.
- Any real payer, EHR, pharmacy, or patient-facing submission.

If a live UiPath feature is missing or unavailable, diagnose in layer order:
confirm command registration, discovery/install state, and official activation
flow first; only debug permissions or runtime after the feature is present.

## Checkpoint 7 Live Proof And Demo Readiness

Checkpoint 7 adds the final smoke for the live-proof story. The first audience
promise is healthcare value: less manual chart review, fewer preventable
denials, faster PA submission, safer appeal prep, auditable human gates, and
UiPath-governed execution. The technical architecture should support that value,
not lead the demo.

Run the static live-proof readiness gate before recording or submitting:

```bash
CI=true pnpm smoke:checkpoint7-live-proof
```

This smoke checks that the package command is registered, the Checkpoint 7 live
proof contract is documented, demo/submission language leads with healthcare
value, and all live claims are backed by actual scripts, smoke commands,
screenshots, logs, captured evidence, or explicit caveats. It does not start a
live UiPath agent, Maestro case, Action Center task, Data Service write,
Orchestrator job, robot run, solution deployment, IXP mutation, or payer
submission.

Minimum final lane checks:

```bash
CI=true pnpm verify:setup
CI=true pnpm format:check
CI=true pnpm verify:submission-readiness
CI=true pnpm smoke:checkpoint6-readiness
CI=true pnpm smoke:checkpoint7-live-proof
git diff --check
```

If the integrated live proof implementation is present, pair this static gate
with the implementation smoke or API script from the live-proof runtime lane.
Only claim live Fireworks/LangSmith output when provider smoke or trace evidence
exists. Only claim live UiPath side effects when approved screenshots or logs
from the `TreatmentAccessHackathon` folder exist.

If the mock API is already running, run the smoke against it directly:

```bash
CI=true pnpm dev:api
node --import tsx/esm scripts/verify-demo.ts --base-url http://127.0.0.1:8787
```

Useful reset and seed helpers:

```bash
CI=true pnpm seed
CI=true pnpm seed:apply
CI=true pnpm reset
node --import tsx/esm scripts/reset-demo.ts --json
```

The smoke assumes these Checkpoint 1 endpoints:

- `GET /health`
- `GET /demo/state`
- `POST /demo/reset`
- `POST /demo/toggles`
- `POST /events`
- `POST /payer/prior-auth`
- `GET /payer/prior-auth/:submissionId/status`

All fixture data is synthetic. The current smoke does not require live UiPath
access; UiPath checks remain discovery/setup checks until Checkpoint 2 wires
Maestro, API Workflows, Action Center, and Orchestrator into the live runtime.

## Checkpoint 8 Final UiPath Proof Readiness

Checkpoint 8 is the final integration layer. It prepares the repository for
live UiPath evidence capture while keeping every side-effecting Cloud action
approval-gated.

Run the no-side-effect final readiness gates:

```bash
CI=true pnpm smoke:checkpoint8-live-uipath
CI=true pnpm smoke:checkpoint8-action-center-proof
CI=true pnpm verify:rpa-portal-fallback
node --import tsx/esm scripts/verify-checkpoint8-uipath-discovery.ts
node --import tsx/esm scripts/verify-checkpoint8-event-bridge.ts
```

These checks verify the final proof manifest, Action Center H2 packet, RPA H3
preflight, read-only Cloud discovery matrix, and strict UiPath event-state
bridge. They do not create tasks, write Data Fabric records, start Orchestrator
jobs, run robots, deploy solutions, or submit payer packets.

Final live claims require visible evidence in `TreatmentAccessHackathon`:

- H1: UiPath-owned event/record ID and timestamp.
- H2: live Action Center task ID/deep link or an explicitly labeled
  UiPath-controlled fallback.
- H3: Orchestrator/Assistant job or robot execution evidence plus portal
  confirmation write-back.
- H4: solution package/deploy/activate evidence, if approved and available.

UiPath setup checks:

```bash
uip user --output table
uip or folders get "TreatmentAccessHackathon" --output table
uip tasks users 7986316 --output table
```
