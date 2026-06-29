# Checkpoint 7-8 Live Proof Governed Hooks

This folder documents the UiPath-owned proof hooks for the Checkpoint 7 local
live-proof contract and the Checkpoint 8 live UiPath evidence bridge. It keeps
the project rule explicit: diagnose registration, discovery, and install state
first; then official activation flows; then permissions and runtime behavior.

All examples use synthetic data and the `TreatmentAccessHackathon` folder. Do
not reuse or modify `AgentFactoryDemo`.

## Local Readiness

Run the lane-specific local verifier:

```bash
CI=true pnpm uipath:live-proof:readiness
```

Run the full local UiPath readiness path:

```bash
CI=true pnpm uipath:readiness -- local
```

These checks validate the live-proof manifest, coded-agent authoring contract,
synthetic samples, command registration docs, local RPA validation/build, and
solution pack dry-run. They do not run live side effects.

## Approval-Gated Surfaces

The machine-readable source of truth is
[`live-proof-governed-hooks.manifest.json`](./live-proof-governed-hooks.manifest.json).
It covers:

- Coded Agent or Agent Builder run/debug;
- Maestro Case run/debug;
- Action Center task creation, assignment, completion, and readback;
- Data Service/Data Fabric entity discovery and record writes;
- Orchestrator job start for the portal fallback process;
- RPA validate/build versus run/debug;
- Solution upload, publish, deploy, and activation.

Every live command in those categories requires explicit approval for that exact
block in the orchestrator thread. Read-only discovery, static validation, local
builds, and solution dry-runs are allowed by default.

## Live Proof Event Contract

The visible proof should emit or draft these synthetic events:

1. `case_live_proof_started`
2. `policy_checked`
3. `evidence_mapped`
4. `human_gate_required`
5. `submission_packet_ready_or_blocked`
6. `payer_api_unavailable_or_not_attempted`
7. `live_proof_completed_or_waiting_for_approval`

The sample event mirror payload is in
[`samples/live-proof-events.sample.json`](./samples/live-proof-events.sample.json).
The sample request is in
[`samples/live-proof-request.sample.json`](./samples/live-proof-request.sample.json).

Checkpoint 8 H1 adds a stricter event-state bridge sample in
[`samples/uipath-written-event-state.sample.json`](./samples/uipath-written-event-state.sample.json).
It may be mirrored into the mock healthcare API only after validation confirms
`source_verification=live_uipath_written`, a UiPath `source_system`, the
`TreatmentAccessHackathon` folder key, and at least one UiPath record/task/job
identifier. The negative sample
[`samples/local-overclaim-event-state.invalid.sample.json`](./samples/local-overclaim-event-state.invalid.sample.json)
proves that a Command Center or local mock event cannot claim live UiPath
authorship without those identifiers.

Local no-side-effect verification:

```bash
node --import tsx/esm scripts/verify-checkpoint8-event-bridge.ts
```

## Evidence Rules

- UiPath is the writer of live case state.
- The Command Center visualizes governed events and trace metadata.
- Every clinical assertion needs source evidence, policy citation, or human
  approval.
- Appeal language is an administrative draft for clinician review, not
  autonomous medical or legal advice.
- No payer submission is allowed in this proof unless separately approved and
  explicitly evidenced.
