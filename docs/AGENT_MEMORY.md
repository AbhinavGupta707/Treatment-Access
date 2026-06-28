# Agent Memory

## Current Project

Treatment Access Command Center for UiPath AgentHack 2026 Track 1 - Maestro Case.

## Key Decisions

- Keep seven domain agents, but require distinct input/output contracts and visible runtime traces.
- Use `TreatmentAccessHackathon` as the UiPath folder.
- Keep `AgentFactoryDemo` untouched.
- Use a hybrid UI strategy: polished custom Command Center plus visible UiPath surfaces.
- Keep IXP/Document Understanding as preferred extraction path, with a schema-compatible fallback parser.
- Treat appeal language as clinician-reviewed administrative draft language.

## Current Setup Risk

Assistant/Robot is installed and available. The connected workspace machine is assigned to `TreatmentAccessHackathon`, and the folder reports one connected/available `Development` runtime. The tenant's single `Unattended` license is intentionally unallocated; reserve it later only if the final RPA portal fallback must run as a fully unattended Orchestrator job.

## Checkpoint 1 Status

Checkpoint 1 is merged and verified on `main`.

Integrated lane commits:

- Demo Data & Fixture: `c9d4e42`
- Mock Healthcare API: `e978bcf`
- QA/Reset: `20efb54`
- Command Center Data Shell: `a86bc68`

Closeout checks passed:

- `CI=true pnpm verify`
- `CI=true pnpm format:check`
- `CI=true pnpm seed`
- `CI=true pnpm smoke:checkpoint1 -- --port 8877`

Integration note: Command Center fallback state was reconciled with the enriched shared schema after merge. The default smoke port `8787` was occupied locally, so live smoke was verified on `8877`.

## Next Checkpoint

Start Checkpoint 2 from the verified `main` branch. Recommended focus: UiPath Core Case Integration, with Maestro case shape, API Workflow calls into the mock API, Action Center/human review handoff, and event writes that appear in the Command Center timeline.
