# Data Service / Data Fabric

Stores case state, evidence mappings, decisions, submissions, appeal packets,
handoffs, and audit events.

## Local Artifacts

- [entities.json](./entities.json) is the machine-readable local entity
  contract. It is not a live Data Fabric export.
- [entity-contract.md](./entity-contract.md) explains entity ownership,
  Data Fabric field types, and downstream lane write/read expectations.
- [event-mirror-contract.md](./event-mirror-contract.md) defines the UiPath task
  events and Command Center read model.

Use `.agents/skills/uipath-platform/SKILL.md` for live Data Fabric operations.

Do not create, update, or delete live Data Fabric entities without explicit
orchestrator approval.

Safe discovery is included in:

```bash
CI=true pnpm uipath:readiness -- cloud
```

Checkpoint 8 H1 event-state bridge validation is local and has no UiPath side
effects:

```bash
node --import tsx/esm scripts/verify-checkpoint8-event-bridge.ts
```

For live Data Service discovery, stay read-only unless approval is granted:

```bash
uip login status --output json
uip df entities list --include-folders --output json
uip df entities list --folder-key 4fba2fa1-012b-469a-b6aa-e5be3811c173 --output json
```

Record writes must stay behind the explicit approval-gated command blocks in
`../live-wiring-runbook.md`, and every event must preserve the synthetic data
disclaimer from `event-mirror-contract.md`.
