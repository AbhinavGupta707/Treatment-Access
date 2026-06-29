# UiPath Artifacts

This directory holds implementation notes, exported artifacts, and screenshots for the UiPath side of the build.

Do not store credentials here.

For Checkpoint 6 live wiring, use [live-wiring-runbook.md](./live-wiring-runbook.md).
For Checkpoint 7 governed live proof hooks, use
[live-proof/README.md](./live-proof/README.md).
The safe readiness wrapper is:

```bash
CI=true pnpm uipath:readiness
```

It performs discovery, validation, build, and solution dry-run checks only. It
does not create Action Center tasks, write Data Service records, start robot or
agent jobs, run Maestro, deploy solutions, or submit payer packets.

For the narrower Checkpoint 7 hook contract, run:

```bash
CI=true pnpm uipath:live-proof:readiness
```
