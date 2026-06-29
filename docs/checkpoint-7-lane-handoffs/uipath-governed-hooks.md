# Checkpoint 7 Lane Handoff: UiPath Coded Agent and Governed Hooks

## Summary

Added the UiPath-side live proof hook surface for Checkpoint 7. The lane now has
a machine-readable governed-hooks manifest, a future Coded Agent authoring
contract, synthetic live-proof request/event samples, and a local verifier that
keeps all live side effects approval-gated by default.

## Files Changed

- `uipath/live-proof/README.md`
- `uipath/live-proof/live-proof-governed-hooks.manifest.json`
- `uipath/live-proof/samples/live-proof-request.sample.json`
- `uipath/live-proof/samples/live-proof-events.sample.json`
- `uipath/coded-agents/live-proof/README.md`
- `uipath/coded-agents/live-proof/coded-agent-authoring-contract.json`
- `scripts/verify-uipath-live-proof-hooks.ts`
- `scripts/uipath-live-readiness.sh`
- `package.json`
- `uipath/README.md`
- `uipath/live-wiring-runbook.md`

## Commands Run

- `uip skills install --agent codex --local`
- `CI=true pnpm uipath:live-proof:readiness`
- `CI=true pnpm uipath:readiness local`
- `CI=true pnpm verify:setup`
- `CI=true pnpm format:check`
- `CI=true pnpm verify`
- `git diff --check`

## Safety Notes

- No live `uip agent debug`, coded-agent run/debug, Maestro run/debug, Action
  Center task creation/assignment/completion, Data Service/Data Fabric write,
  Orchestrator job start, RPA run/debug, solution upload/publish/deploy/activate,
  IXP mutation, or payer submission was run.
- The samples use only synthetic `case-syn-*`, `patient-syn-*`,
  `demo-run-syn-*`, and placeholder trace identifiers.
- The manifest explicitly keeps this project in `TreatmentAccessHackathon` and
  guards against reusing `AgentFactoryDemo`.

## Risks

- The real Checkpoint 7 runtime contract from the Live Proof Schemas/API lane
  may add field names after this lane was created. Integration should map those
  fields into the manifest's `TreatmentAccessLiveProofRequest` and
  `TreatmentAccessLiveProofRun` names, or update this authoring packet if the
  final schema names differ.
- During `CI=true pnpm uipath:readiness local`, optional
  `uip solution resource refresh` hit an auth-file lock and optional
  analyzer/validate probes hit a UiPath Helm readiness timeout. The wrapper
  continued as designed; mandatory `uip rpa build` and solution pack dry-run
  both passed.
- The Data Fabric folder-scoped commands remain dependent on the installed CLI
  exposing the required `--folder-key` behavior. The runbook keeps Data Fabric
  writes approval-gated until discovery proves the surface is present.
- The coded agent folder is intentionally an authoring packet, not a scaffolded
  coded agent project. If the team chooses the coded-agent route, scaffold with
  `uip codedagent new` and derive bindings through the official sync workflow.

## Integration Notes

- Keep `CI=true pnpm uipath:live-proof:readiness` in the local readiness path.
  It is fast and catches drift in the governed hook contract.
- The UI lane can use the event types in
  `uipath/live-proof/samples/live-proof-events.sample.json` for labels, but must
  keep the Command Center as a visualization surface rather than the writer of
  live case state.
- The QA lane can include this verifier in final Checkpoint 7 checks before any
  approved live UiPath smoke.
