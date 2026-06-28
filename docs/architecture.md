# Architecture

The system is split into four layers:

1. **UiPath orchestration layer** - Maestro Case, Agent Builder, API Workflows, Action Center, Orchestrator, Data Service, and Assistant/Robot.
2. **Mock system layer** - synthetic EHR, payer, pharmacy, denial, and event mirror APIs.
3. **Presentation layer** - Treatment Access Command Center and mock payer portal.
4. **Contract layer** - shared TypeScript/Zod schemas and deterministic synthetic fixtures.

The custom UI must not be the source of case truth. It displays live case snapshots and audit events written by UiPath or by UiPath-called endpoints.

## Checkpoint 0 Boundaries

This scaffold creates the repo structure, runnable packages, setup docs, and first contracts. It does not implement final UI design, full agent behavior, Maestro caseplan files, or production UiPath workflows.

Those belong to later orchestration checkpoints.
