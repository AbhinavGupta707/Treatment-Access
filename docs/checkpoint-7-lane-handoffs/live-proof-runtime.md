# Checkpoint 7 Lane Handoff: Live Proof Runtime

Lane: Live Proof Schemas, API, and Agent Runtime

## Files Changed

- `packages/shared-schemas/src/index.ts`
  - Added `LiveProofRun`, `LiveProofStep`, `LiveProofTrace`,
    `LiveProofApprovalGate`, `UiPathEvidenceRef`, and stage/status schemas.
- `packages/agent-runtime/src/index.ts`
  - Added `runTreatmentAccessLiveProof`.
  - Added a Fireworks structured-provider adapter for `AGENT_MODE=live`.
  - Validates all seven agent outputs, projects the run to the seven visible
    Checkpoint 7 stages, captures LangSmith metadata/URL when supplied, and
    emits synthetic mirror events.
- `services/mock-healthcare-api/src/index.ts`
  - Added `POST /live-proof-runs`, `GET /live-proof-runs`, and
    `GET /live-proof-runs/:runId`.
  - Stores synthetic live proof runs in memory and appends the seven mirror
    events to the existing audit event feed.
- `services/mock-healthcare-api/openapi/openapi.yaml`
  - Documented the live proof route and request schema.
- `scripts/verify-checkpoint7-live-proof.ts`
  - Added deterministic no-secret smoke for the runtime and API event mirror.
- `package.json`
  - Added `smoke:checkpoint7-live-proof`.
- Tests updated:
  - `packages/shared-schemas/test/schemas.test.ts`
  - `packages/agent-runtime/test/agent-runtime.test.ts`
  - `services/mock-healthcare-api/test/api.test.ts`
- `services/mock-healthcare-api/package.json` and `pnpm-lock.yaml`
  - Added the API dependency on `@tacc/agent-runtime`.

## Commands Run

- `CI=true pnpm build:contracts`
  - Blocked before compilation. The isolated worktree lacked installed
    packages, and sandboxed registry access failed with DNS `ENOTFOUND`.
- `CI=true pnpm build:contracts` with escalation
  - Rejected by the approval reviewer because it would fetch/install external
    npm registry code into the workspace.
- `pnpm install --offline`
  - Failed with `ERR_PNPM_NO_OFFLINE_TARBALL` for uncached `@types/node`.
- `git diff --check`
  - Run after final edits by this lane worker.

## Verification Status

The intended verification commands for this lane are:

```bash
CI=true pnpm build:contracts
CI=true pnpm smoke:agents
CI=true pnpm smoke:live-agents
CI=true pnpm verify:setup
git diff --check
```

Only `git diff --check` could run in this isolated worktree without dependency
installation. The pnpm-based checks are blocked by missing local packages plus
disallowed network package installation, not by an observed TypeScript/test
failure.

## Runtime Notes

- Default smoke mode is deterministic and no-secret.
- If `AGENT_MODE=live` is active and runtime validation passes, the live proof
  runner uses the Fireworks structured provider path for all seven agents.
- If `AGENT_MODE=live` is active but required keys are missing, the runner
  fails clearly instead of silently downgrading.
- LangSmith trace URL is stored when supplied; otherwise the run records
  metadata-only or not-configured status.
- The API writes these seven synthetic event mirror actions:
  - `case_live_proof_started`
  - `policy_checked`
  - `evidence_mapped`
  - `human_gate_required`
  - `submission_packet_ready_or_blocked`
  - `payer_api_unavailable_or_not_attempted`
  - `live_proof_completed_or_waiting_for_approval`

## Safety

- Synthetic data only.
- No live UiPath side-effect commands were run.
- No Action Center task, Data Service/Data Fabric write, Orchestrator job,
  Maestro run, RPA run, solution deploy, IXP mutation, or payer submission was
  attempted.
- The run contract explicitly records `no_live_uipath_side_effects: true` and
  `no_real_payer_submission: true`.

## Next Integration Notes

- After dependency installation is available in the integration worktree, run:

```bash
CI=true pnpm build:contracts
CI=true pnpm --filter @tacc/mock-healthcare-api test
CI=true pnpm smoke:checkpoint7-live-proof
CI=true pnpm smoke:agents
CI=true pnpm smoke:live-agents
CI=true pnpm verify:setup
git diff --check
```

- The UI lane can call `POST /live-proof-runs` and then refresh
  `/cases/case-syn-001/events` or `GET /live-proof-runs/:runId`.
- The UiPath hooks lane can later replace or augment `uipath_event_mirror`
  references with real UiPath-written event/Data Service evidence, but should
  keep the same live proof schema and stage names.
