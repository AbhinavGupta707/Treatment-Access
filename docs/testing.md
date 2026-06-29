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

UiPath setup checks:

```bash
uip user --output table
uip or folders get "TreatmentAccessHackathon" --output table
uip tasks users 7986316 --output table
```
