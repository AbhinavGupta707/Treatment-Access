# Treatment Access Command Center

Treatment Access Command Center is a UiPath AgentHack 2026 Track 1 project for
specialty-medication prior authorization, payer fallback, denial rescue, and
care-continuity handoff.

The demo reframes prior authorization as a governed treatment-access case. A
synthetic medication order moves through policy extraction, source-grounded
evidence mapping, clinician validation, payer submission, portal fallback when
the API is unavailable, denial analysis, administrative appeal drafting, approval,
pharmacy handoff, and audit packaging.

UiPath is the orchestration and governance layer. The custom apps are
judge-facing visual surfaces; live proof state is now also recorded in UiPath
Data Fabric, Action Center, Solution, Orchestrator, and Maestro debug records
under the `TreatmentAccessHackathon` folder.

## Devpost Submission Requirements

This repository is the public code submission for **UiPath AgentHack 2026 -
Track 1: UiPath Maestro Case**.

### Project Description

Treatment Access Command Center solves the specialty-medication prior
authorization bottleneck. Access teams must coordinate payer policy criteria,
chart evidence, clinician attestations, payer submissions, denial responses,
appeals, and pharmacy handoffs across disconnected systems. The product turns
that fragmented work into a governed UiPath case: agents assemble the evidence
and packet, UiPath orchestrates the case state and proof trail, and humans
approve high-impact clinical assertions before payer-facing work proceeds.

A judge can run the local synthetic product and walk one case from intake to
policy matching, evidence mapping, clinician review, payer-channel exception
routing, denial rescue, appeal readiness, and UiPath proof review. The project
uses synthetic data only and does not submit real payer requests or use real
patient, provider, payer, credential, or personal health data.

### UiPath Components Used

- **UiPath Maestro Case**: dynamic treatment-access lifecycle with stages for
  intake, policy check, evidence mapping, clinician signoff, submission, denial
  rescue, appeal, and care handoff.
- **UiPath Maestro Flow / HITL design**: clinician-validation flow and
  human-task boundary proof for accountable review.
- **UiPath Agent Builder contracts**: seven specialist agents for coverage
  requirements, evidence retrieval, missing evidence, submission packet, denial
  rescue, appeal packet, and care continuity.
- **Coded Agents / external agent runtime**: TypeScript agent-runtime package
  with shared schemas and deterministic/local provider-ready behavior used by
  smoke tests and the Command Center.
- **UiPath API Workflow artifacts**: EHR hydration, payer submission/status,
  pharmacy handoff, and event-write contracts.
- **UiPath Action Center**: clinician evidence approval and appeal signoff
  patterns; live ExternalTask `4401667` was created, assigned, completed, and
  read back with synthetic clinician-attestation output.
- **UiPath Data Fabric / Data Service**: folder-scoped proof entity
  `TreatmentAccessProofEvent` and synthetic proof records under the
  `TreatmentAccessHackathon` folder.
- **UiPath Orchestrator**: folder, machine assignment, process, logs, and live
  job execution for the `PayerPortalFallback` process.
- **UiPath RPA / Assistant robot project**: `PayerPortalFallback` project and
  solution-packaged robot process for payer API unavailable scenarios.
- **UiPath Solutions**: package `treatment-access-command-center@1.0.20260629`
  published, deployed, and activated in Automation Cloud.
- **UiPath Apps / Action App contracts**: intake and human-review surface
  contracts documented for production UI handoff.
- **UiPath IXP / Document Understanding design path**: production extraction
  target for policies, chart notes, labs, and denial letters; local source-span
  parser preserves the same evidence contract in the synthetic workflow.
- **UiPath for Coding Agents / Codex**: checkpointed implementation lanes,
  merge logs, and QA traces used to build, test, and integrate the project.

### Agent Type

This solution uses **both Coded Agents and Low-code Agent Builder-style agents**.

- **Coded Agents**: TypeScript agent runtime and shared Zod contracts implement
  the local, testable behavior for coverage, evidence, missing-evidence,
  submission, denial, appeal, and care-continuity outputs.
- **Low-code Agent Builder artifacts**: UiPath agent packet folders, contracts,
  sample outputs, entry points, and validation artifacts are included under
  `uipath/agents/**` for the UiPath-native agent layer.

UiPath remains the orchestration and governance layer. The custom React apps are
visualization and judge-facing operator surfaces.

### Setup Instructions For Judging

1. Clone the public repository:

   ```bash
   git clone https://github.com/AbhinavGupta707/Treatment-Access.git
   cd Treatment-Access
   ```

   If the cloned folder name differs, run the remaining commands from the repo
   root that contains this `README.md`.

2. Install Node.js 22+ and pnpm 11+. This project was built with
   `pnpm@11.7.0`.

3. Install dependencies:

   ```bash
   CI=true pnpm install
   ```

4. Verify the local setup:

   ```bash
   CI=true pnpm verify:setup
   ```

5. Run the full local verification suite if time allows:

   ```bash
   CI=true pnpm verify
   ```

6. Start the three local product surfaces in separate terminals:

   ```bash
   CI=true pnpm dev:api
   CI=true pnpm dev:command-center
   CI=true pnpm dev:mock-payer
   ```

7. Open the Command Center:

   ```text
   http://127.0.0.1:5173
   ```

8. Optional: open the synthetic payer portal used by the portal-recovery route:

   ```text
   http://127.0.0.1:5174
   ```

9. Demo path for judges:

   - Start on **Dashboard** to see active cases, risk, clinician signoff load,
     and the urgent synthetic case.
   - Open **Cases** to inspect `TACC-2026-001`, the treatment, payer, deadline,
     actors, and recent activity.
   - Open **Evidence** and select the first row showing `Needs Signoff` to see
     policy criteria, evidence source, confidence, and clinical-review gating.
   - Return to **Dashboard** and run the case orchestration card to show the
     seven-agent case preparation flow.
   - Open **Submissions** to see the payer API unavailable branch and the
     governed portal-recovery path.
   - Open **Appeals** to see denial rescue, appeal packet assembly, supporting
     attachments, clinician attestation, and signoff.
   - Return to **Dashboard** and open **UiPath records** to inspect the live
     proof IDs and safety boundary.

10. Optional focused smoke commands:

    ```bash
    CI=true pnpm seed
    CI=true pnpm smoke:agents
    CI=true pnpm smoke:checkpoint8-live-uipath
    ```

11. UiPath live proof is documented in
    `docs/live-uipath-proof-closeout.md`. The proof uses the
    `TreatmentAccessHackathon` folder in the `galacticus` org and
    `DefaultTenant` tenant.

## Current Status

This repository is demo-ready for the local synthetic product path and has a
completed Checkpoint 8 live UiPath proof. The final Command Center leads with
healthcare value while keeping task, job, record, confirmation, source, and
safety evidence in a proof drawer/manifest instead of cluttering the product
screen.

Already implemented:

- TypeScript monorepo with shared Zod contracts, deterministic synthetic data,
  setup verification, reset, seed, and smoke scripts.
- Mock healthcare API covering EHR, payer, pharmacy, demo toggles, and event
  mirror endpoints.
- Command Center UI that shows the case queue, event mirror state, seven agent
  traces, evidence matrix, Action Center gates, payer API failure, portal robot
  fallback state, denial rescue, appeal/care handoff, and audit timeline.
- Final proof manifest in the Command Center for UiPath folder
  `TreatmentAccessHackathon`, folder ID `7986316`, folder key
  `4fba2fa1-012b-469a-b6aa-e5be3811c173`, event/record ID, task ID, job ID,
  confirmation ID, source labels, timestamp, and safety status when available.
- Live UiPath proof closeout in `docs/live-uipath-proof-closeout.md`: Data
  Fabric proof entity `feea1705-e673-f111-ac9a-002248a16d28`, solution package
  `treatment-access-command-center@1.0.20260629`, deployment
  `46ec1e63-3b09-4308-8b44-ed4b65e4e7f7`, and successful Orchestrator job
  `6d9b9fa9-f582-4983-98fa-167e87d57f2a`.
- Mock Payer Portal with stable automation selectors and deterministic synthetic
  confirmation IDs such as `AVFH-PORTAL-SYN-001`.
- UiPath design artifacts for Maestro Case, Data Service/Data Fabric shape, API
  Workflows, Action Center contracts, Apps intake, Agent Builder packets, and a
  local solution shell.
- Seven local agent contracts and deterministic runtime smoke coverage.
- Local proof that direct payer API submission can fail while
  `portal_fallback` succeeds and writes robot-flavored event state.

Still not claimed:

- No real payer submission, real PHI, real payer credential use, IXP mutation,
  live Maestro run, live Agent Builder run, or autonomous clinical/appeal
  approval is claimed.
- Action Center has live proof: ExternalTask `4401667` was created, assigned,
  completed, and read back with synthetic clinician-attestation output. The
  inline Maestro/HITL task boundary still needs production hardening.
- The real `PayerPortalFallback` process was deployed and completed one live
  Orchestrator job, but the current `Main.xaml` is scaffold-only. UI Automation
  target capture and actual browser portal form submission remain future work.

## Proof Types

| Proof type            | What it means                                                                                                    | Current wording rule                                                                                                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local Synthetic Proof | Deterministic local apps, mock API, mock portal, event mirror, agent runtime, screenshots, and smoke commands.   | Can be shown as working local proof with synthetic data only.                                                                                                                                                                            |
| Live Provider Proof   | Fireworks/LangSmith readiness or traces after provider credentials are configured and the provider smoke passes. | Claimed only after `CI=true pnpm smoke:checkpoint6-live-providers` or equivalent captured evidence.                                                                                                                                      |
| Live UiPath Proof     | UiPath Automation Cloud evidence in `TreatmentAccessHackathon`: record/task/job/confirmation IDs and timestamps. | Completed for Data Fabric proof state, one Action Center ExternalTask, solution publish/deploy/activation, one Orchestrator job, and Maestro debug proof up to the HITL boundary; portal UIA remains honestly labelled as not completed. |

## Problem

Specialty-medication access breaks down when payer policy requirements, chart
evidence, clinician attestations, payer submissions, denials, appeals, and
handoffs live in separate systems. Staff lose time reconstructing why a case is
blocked, clinicians are asked to approve unsupported wording, and patients wait
while prior authorization exceptions bounce between teams.

## Solution

Treatment Access Command Center coordinates the case as a governed workflow:

1. Start with a synthetic treatment order.
2. Resolve payer criteria and required documents.
3. Map each clinical assertion to source evidence, a policy citation, or a
   human approval gate.
4. Block submission when required safety evidence is missing.
5. Build a payer packet only after validation.
6. Attempt payer API submission.
7. Trigger a portal fallback path when the API is unavailable.
8. Analyze denial reason and draft an administrative appeal for clinician
   review.
9. Hand approved therapy to pharmacy/scheduling.
10. Preserve an audit trail of agents, humans, robots, workflows, and evidence.

Appeal language is always an administrative draft for clinician review. It is not
autonomous medical or legal advice.

## UiPath Role

The intended live architecture keeps UiPath in charge of orchestration,
governance, approvals, and auditability:

| UiPath component           | Role in this project                                                                    | Current repo status                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Maestro Case               | Outer treatment-access lifecycle with stages and secondary exception paths.             | SDD and case design documented under `uipath/maestro`.                                                                              |
| Agent Builder              | Seven domain agents with distinct inputs, outputs, trace summaries, and audit payloads. | Local Agent Builder packets exist and were statically validated during Checkpoint 3.                                                |
| API Workflows              | EHR hydration, payer submission/status, pharmacy handoff, and event writes.             | Workflow JSON artifacts and validation notes exist under `uipath/api-workflows`.                                                    |
| Action Center              | Clinician evidence approval, appeal signoff, and exception review gates.                | Live ExternalTask `4401667` was created, assigned, completed, and read back with synthetic clinician-attestation output.            |
| Data Service/Data Fabric   | Case, evidence, decision, human task, and audit data model.                             | Live folder-scoped `TreatmentAccessProofEvent` entity and proof records created under `TreatmentAccessHackathon`.                   |
| Orchestrator               | Folder, assets, logs, job launch, and robot runtime governance.                         | Solution folder, process, machine assignment, and successful Development-runtime job are recorded.                                  |
| Assistant/Robot            | Mock payer portal fallback when payer API is unavailable.                               | `PayerPortalFallback` is deployed and job-runnable; current XAML is scaffold-only, so portal UIA capture/submission is not claimed. |
| IXP/Document Understanding | Preferred production extraction path for policy, chart, lab, and denial documents.      | Tenant service reachable, but local CLI lacks the `uip ixp` command prefix; fallback parser preserves source spans.                 |

## Seven Agents

| Agent                      | Responsibility                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Coverage Requirement Agent | Resolves authorization requirements, criteria, required documents, submission channels, and policy citations. |
| Evidence Retrieval Agent   | Maps synthetic chart artifacts to criteria and flags evidence confidence, source spans, and review needs.     |
| Missing Evidence Agent     | Detects blocking gaps such as missing TB/hepatitis safety screening and drafts human task payloads.           |
| Submission Packet Agent    | Builds payer packet fields only when evidence and clinician gates allow submission.                           |
| Denial Rescue Agent        | Parses denial/RFI category and selects a source-grounded rescue strategy.                                     |
| Appeal Packet Agent        | Drafts administrative appeal language with citations, warnings, and clinician signoff requirements.           |
| Care Continuity Agent      | Plans pharmacy and scheduling handoff after payer or appeal approval.                                         |

An Audit Packet Agent packet also exists for closure/audit packaging, but the
core product story and runtime smoke focus on the seven treatment-access domain
agents above.

## Local App And API Surfaces

| Surface             | Command                   | Default URL             | Purpose                                                    |
| ------------------- | ------------------------- | ----------------------- | ---------------------------------------------------------- |
| Mock Healthcare API | `pnpm dev:api`            | `http://127.0.0.1:8787` | Synthetic EHR, payer, pharmacy, toggles, and event mirror. |
| Command Center      | `pnpm dev:command-center` | `http://127.0.0.1:5173` | Judge-facing case cockpit and audit walkthrough.           |
| Mock Payer Portal   | `pnpm dev:mock-payer`     | `http://127.0.0.1:5174` | Browser portal for the RPA fallback path.                  |

Key local API endpoints include:

- `GET /health`
- `GET /demo/state`
- `POST /demo/reset`
- `POST /demo/toggles`
- `POST /events`
- `POST /payer/prior-auth`
- `GET /payer/prior-auth/:submissionId/status`

## Quick Start

Install dependencies:

```bash
CI=true pnpm install
```

Run the main verification suite:

```bash
CI=true pnpm verify
```

Use `CI=true` in non-interactive shells so pnpm never pauses for an install
confirmation prompt.

Run the three local demo surfaces in separate terminals:

```bash
CI=true pnpm dev:api
CI=true pnpm dev:command-center
CI=true pnpm dev:mock-payer
```

If the Command Center needs a non-default API URL, set
`VITE_TACC_API_BASE_URL` before starting it.

## Smoke And Verification Commands

Setup and formatting gates:

```bash
CI=true pnpm verify:setup
CI=true pnpm format:check
git diff --check
```

Focused local proof commands:

```bash
CI=true pnpm seed
CI=true pnpm smoke:checkpoint1
CI=true pnpm smoke:agents
CI=true pnpm smoke:checkpoint4
CI=true pnpm smoke:checkpoint8-live-uipath
```

Full local verification:

```bash
CI=true pnpm typecheck
CI=true pnpm test
CI=true pnpm build
CI=true pnpm verify
```

If another local process is using a smoke-test port, pass an alternate port, for
example:

```bash
CI=true pnpm smoke:checkpoint4 -- --port 8894
```

## Mocked Vs Live Matrix

| Capability                                       | Local synthetic proof                                                              | Live UiPath/payer status                                                                                  |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Synthetic case data and policy/evidence fixtures | Implemented in `packages/demo-data`.                                               | No real PHI, payer, provider, credential, or patient data.                                                |
| Event mirror and Command Center state            | Implemented through mock API and UI.                                               | Final proof IDs are recorded in UiPath Data Fabric and surfaced in the proof manifest.                    |
| Seven agent contracts and traces                 | Deterministic runtime smoke passes locally.                                        | Agent Builder packets validated statically; no live agent run/debug claimed.                              |
| Maestro case lifecycle                           | SDD, stage model, and integration contracts documented.                            | Live case/flow debug reached the human-task boundary; inline HITL task creation faulted there.            |
| API Workflows                                    | Workflow JSON artifacts and local contracts exist.                                 | No side-effecting live workflow execution claimed.                                                        |
| Action Center gates                              | Task contracts and UI gates are represented locally.                               | Live ExternalTask `4401667` was created, assigned, completed, and read back with synthetic data.          |
| Data Service/Data Fabric                         | Entity model documented.                                                           | Live proof entity and records created in `TreatmentAccessHackathon`.                                      |
| Payer API unavailable path                       | `channel="api"` returns `PAYER_API_DOWN` under the toggle.                         | No real payer submission claimed.                                                                         |
| Portal fallback                                  | Local `channel="portal_fallback"` succeeds and records robot-flavored event state. | Real UiPath process is deployed and job-complete; portal UIA capture/form submission remains not claimed. |
| Mock payer portal                                | Browser app produces deterministic synthetic receipt state.                        | No live external portal used.                                                                             |
| IXP/Document Understanding                       | Fallback parser preserves source spans and confidence.                             | Local CLI lacks registered `uip ixp`; no IXP mutation claimed.                                            |
| Solution packaging                               | Local solution shell includes `PayerPortalFallback` and passes pack dry-run.       | Published, deployed, and activated as `treatment-access-command-center@1.0.20260629`.                     |

## Safety And Privacy

- Use synthetic data only.
- Do not add real PHI, payer credentials, provider identifiers, or patient
  contact data.
- Every clinical assertion must have source evidence, a policy citation, or
  human approval.
- Missing or low-confidence evidence blocks submission instead of being hidden.
- Appeal content is administrative draft language for clinician review.
- Future live side effects still require explicit approval. The approved final
  proof already created Data Fabric proof records, deployed/activated the
  solution, assigned the workspace machine to the solution folder, and ran one
  Orchestrator job. No real payer submission or real PHI is allowed.

## Repo Layout

```text
apps/command-center          Judge-facing operational dashboard
apps/mock-payer-portal       Browser portal used by the RPA fallback path
services/mock-healthcare-api Mock EHR, payer, pharmacy, toggles, and event API
packages/shared-schemas      Shared TypeScript/Zod contracts
packages/demo-data           Synthetic seed data
packages/agent-runtime       Deterministic seven-agent local runtime
uipath/maestro               Maestro Case stage design
uipath/api-workflows         API Workflow artifacts and contracts
uipath/action-center         Human approval task contracts
uipath/data-service          Data Service/Data Fabric model
uipath/agents                Agent Builder packets and contracts
uipath/robots                Portal fallback robot project shell, contract, and approval gates
uipath/solution              Local UiPath solution shell with imported RPA process
docs                         Setup, testing, demo, submission, and logs
scripts                      Seed/reset/setup/smoke verification helpers
```

## Documentation

- [UiPath setup](docs/setup-uipath.md)
- [Testing](docs/testing.md)
- [Demo script](docs/demo-script.md)
- [Submission package](docs/submission.md)
- [Orchestration log](docs/orchestration-log.md)
- [Implementation plan](treatment_access_command_center_implementation_plan.md)

## License

MIT. See [LICENSE](LICENSE).
