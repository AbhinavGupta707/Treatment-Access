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
