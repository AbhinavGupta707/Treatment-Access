# Treatment Access Command Center

Treatment Access Command Center is a UiPath AgentHack 2026 Track 1 project for specialty-medication prior authorization and denial rescue.

The product reframes prior authorization as a governed treatment-access case. A synthetic patient order moves through payer policy extraction, evidence mapping, clinician validation, payer submission, denial rescue, appeal signoff, approval, and specialty-pharmacy handoff.

## Current Status

Checkpoint 0 scaffold is in progress:

- UiPath folder: `TreatmentAccessHackathon`
- UiPath CLI tools installed locally
- Project-local UiPath Codex skills installed locally
- Monorepo scaffold for custom UI, mock APIs, shared schemas, demo data, UiPath docs, and verification scripts

## Quick Start

```bash
pnpm install
CI=true pnpm verify
```

Use the `CI=true` prefix in Codex or other non-interactive shells so pnpm never pauses for an install confirmation prompt.

Run individual surfaces:

```bash
pnpm dev:api
pnpm dev:command-center
pnpm dev:mock-payer
```

## Repo Layout

```text
apps/command-center          Judge-facing operational dashboard
apps/mock-payer-portal       Browser portal used by the RPA fallback path
services/mock-healthcare-api Mock EHR, payer, pharmacy, and event mirror API
packages/shared-schemas      Shared TypeScript/Zod contracts
packages/demo-data           Synthetic seed data
uipath/                      UiPath implementation notes and artifacts
docs/                        Architecture, setup, orchestration, and test docs
scripts/                     Seed/reset/setup verification helpers
```

## UiPath Integration

UiPath is not a bolt-on. The target architecture uses:

- Maestro Case for the case lifecycle
- Agent Builder for seven specialized agents
- API Workflows for EHR, payer, pharmacy, and event-mirror calls
- Action Center for clinician evidence approval and appeal signoff
- Data Service/Data Fabric for case state and audit records
- Orchestrator for assets, jobs, logs, and robot execution
- Assistant/Robot for the mock payer portal fallback
- IXP/Document Understanding when available, with a live fallback parser

## Synthetic Data Only

This hackathon prototype uses fictional patients, policies, payers, medications, documents, and decisions. Do not add real PHI.

## Setup Docs

- [UiPath setup](docs/setup-uipath.md)
- [Architecture](docs/architecture.md)
- [Testing](docs/testing.md)
- [Orchestration log](docs/orchestration-log.md)
- [Implementation plan](treatment_access_command_center_implementation_plan.md)
