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
