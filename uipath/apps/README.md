# UiPath Apps

Checkpoint 2 uses a UiPath-native intake launch contract rather than a
separate Coded Web App scaffold.

Primary path:

1. Build a low-code UiPath Apps page named `Treatment Access Intake`, or use
   the Maestro Case App manual start surface if Apps binding is not available
   in time.
2. Capture the fields in
   [schemas/intake-launch.schema.json](schemas/intake-launch.schema.json).
3. Submit the payload to the Maestro manual case start path, with
   `StartTreatmentAccessCase` as the first case task/API Workflow.
4. The first workflow writes the `case.created` event mirror record described in
   [schemas/event-mirror-record.schema.json](schemas/event-mirror-record.schema.json).
5. Operators then switch to Maestro, Action Center, and the Command Center.

The custom Command Center remains the polished judge-facing visualization. This
layer only starts the real UiPath case and gives the demo operator a visible
UiPath surface for the opening moment.

## Files

- [intake-launch-contract.md](intake-launch-contract.md) - field contract,
  launch path, event mirror handoff, and integration notes.
- [demo-operator-runbook.md](demo-operator-runbook.md) - demo operator steps
  for opening intake, launching a synthetic case, and switching surfaces.
- [wireframes/intake-form.md](wireframes/intake-form.md) - low-code Apps /
  Case App layout notes.
- [schemas/intake-launch.schema.json](schemas/intake-launch.schema.json) -
  parseable launch payload schema.
- [schemas/event-mirror-record.schema.json](schemas/event-mirror-record.schema.json)
  - parseable event mirror schema for the first UiPath-written event.
- [samples/](samples/) - synthetic example payloads for happy path and denial
  rescue scenarios.

## Decision

No `app.config.json`, `action-schema.json`, Coded Web App, or Coded Action App
is created for Checkpoint 2. That avoids a second frontend publish path and keeps
the fastest live demo path centered on UiPath Apps, Maestro Case, API Workflows,
Action Center, and the existing Command Center.
