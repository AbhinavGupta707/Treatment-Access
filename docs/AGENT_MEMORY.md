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

Data/contracts, mock API, and QA/reset lanes are merged into `main`. Command Center Data Shell is still active in its isolated worktree and should be reviewed/merged last after it reports completion.
