# Evidence Manifest

All evidence in this folder must use synthetic demo data only. Do not capture
real patient, payer, provider, credential, or personal health data. Appeal
language is administrative draft content for clinician review, not autonomous
medical or legal advice.

## Local Synthetic Proof

| File                                       | What it proves                                                                                                                                                                            | Exact command or path                                                                                                                                         | Status                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `command-center-local.png`                 | Command Center renders the synthetic treatment access case, `Live event mirror`, evidence matrix, agent traces, Action Center gates, and mocked-vs-live disclosure from local demo state. | `CI=true pnpm build:contracts`; `CI=true pnpm dev:api`; `CI=true pnpm dev:command-center`; headless Chrome DevTools capture from `http://192.168.1.205:5173`. | Captured local synthetic proof on 2026-06-29 |
| `mock-payer-portal-local.png`              | Mock Payer Portal renders the robot-targetable prior authorization form with synthetic defaults and no real PHI entry.                                                                    | `CI=true pnpm dev:mock-payer`; headless Chrome DevTools capture from `http://192.168.1.205:5174` before submit.                                               | Captured local synthetic proof on 2026-06-29 |
| `mock-payer-portal-confirmation-local.png` | Mock Payer Portal accepts the default synthetic form and shows receipt `AVFH-PORTAL-SYN-001` for the portal fallback story.                                                               | `CI=true pnpm dev:mock-payer`; headless Chrome DevTools click on `[data-testid="submit-prior-auth"]`; capture receipt from `http://192.168.1.205:5174`.       | Captured local synthetic proof on 2026-06-29 |

Note: `127.0.0.1:5173` was already occupied by an Agent Factory local listener
during capture. The Command Center Vite server for this project was the
wildcard listener advertised at `http://192.168.1.205:5173`, with page title
`Treatment Access Command Center`.

## Live UiPath Proof

These captures require explicit approval and account/browser action. Do not
fabricate them from local mock state.

| Required capture                  | What it proves                                                                                   | Manual path                                                                                                               | Status                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Maestro Case                      | Treatment access lifecycle is present in UiPath Maestro Case under `TreatmentAccessHackathon`.   | Automation Cloud -> `galacticus` -> `DefaultTenant` -> folder `TreatmentAccessHackathon` -> Maestro Case instance/detail. | Manual capture required |
| Action Center task                | Clinician evidence or appeal signoff gate exists as a live human approval surface.               | Automation Cloud -> Action Center -> Tasks filtered to `TreatmentAccessHackathon` treatment-access task.                  | Manual capture required |
| Orchestrator job / robot run      | `PayerPortalFallback` robot is registered or run through UiPath, not only the local mock portal. | Automation Cloud -> Orchestrator -> folder `TreatmentAccessHackathon` -> Jobs / Robot logs for the fallback process.      | Manual capture required |
| Agent Builder trace               | One treatment-access agent produces a live trace/output with distinct contract fields.           | Automation Cloud -> Agent Builder -> selected treatment-access agent -> trace/run detail.                                 | Manual capture required |
| Data Service / Data Fabric record | UiPath-written case/event state exists in the live tenant when approved.                         | Automation Cloud -> Data Service/Data Fabric -> treatment-access entity/table record for synthetic case `case-syn-001`.   | Manual capture required |

## Submission Boundary

Current local screenshots are local synthetic proof only. Live UiPath proof is
limited to screenshots captured from the `TreatmentAccessHackathon` folder after
explicit approval. The Command Center may visualize state, but live case state
must be produced by UiPath workflows, agents, robots, human actions, or
UiPath-written event records.
