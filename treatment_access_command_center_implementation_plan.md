# Treatment Access Command Center - Implementation Plan

**Project:** Treatment Access Command Center
**Track:** UiPath AgentHack 2026 Track 1 - UiPath Maestro Case
**Plan date:** 2026-06-28
**Primary build goal:** A live, end-to-end, synthetic-data treatment access case system where UiPath Automation Cloud is the orchestration and governance layer for agents, robots, APIs, human decisions, documents, and audit history.

---

## 1. North Star

Build a differentiated treatment-access command center, not a generic healthcare claims assistant and not a clinical-trial document reviewer.

The product moves a synthetic specialty medication order through:

1. Treatment order intake.
2. Payer policy extraction.
3. Chart evidence mapping.
4. Missing-evidence detection.
5. Clinician validation.
6. Payer submission through API.
7. RPA fallback through a mock payer portal.
8. Denial parsing.
9. Source-grounded administrative appeal drafting.
10. Clinician appeal signoff.
11. Approval.
12. Specialty pharmacy / scheduling handoff.
13. Audit packet generation.

The demo must show work moving through a governed enterprise case, with UiPath visibly coordinating the work. The custom UI may be beautiful, but it must display live case state produced by UiPath tasks, not local-only mock state.

---

## 2. Hackathon Scoring Strategy

The current AgentHack brief says solutions must run on UiPath Automation Cloud and use UiPath as the execution and orchestration layer that ties together agents, people, automations, and applications. Track 1 specifically asks for dynamic, exception-heavy case work with handoffs between agents, robots, and people while keeping humans in charge at key decisions.

### Score Maximization

| Criterion                                      | Implementation requirement                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Business Impact & Adoption Potential           | Show treatment delay reduction, reduced PA staff burden, faster denial rescue, and audit-ready evidence for every clinical claim.                                                                                                                                                                                         |
| Platform Usage                                 | Use Maestro Case as the outer lifecycle, Agent Builder for seven agents, API Workflows for mock EHR/payer/pharmacy APIs, Action Center for clinician gates, Data Service/Data Fabric for case state, Orchestrator for jobs/assets/logs, Studio robot for portal fallback, and IXP/Document Understanding where available. |
| Technical Execution, Feasibility & Versatility | Prove exception handling: missing safety screen, payer API outage, denial reason variation, clinician rejection, low-confidence extraction, and retry/fallback logic.                                                                                                                                                     |
| Completeness of Delivery                       | Public repo, README, setup, seed/reset, demo script, architecture diagram, screenshots, video under five minutes, deck, license.                                                                                                                                                                                          |
| Creativity & Innovation                        | Position as "treatment access orchestration" with a policy-to-evidence matrix and denial-to-care-continuity loop. Avoid generic claims automation language.                                                                                                                                                               |
| Coding Agents Bonus                            | Document Codex/orchestration workflow usage, prompts/session summaries, generated tests/fixtures/robot scaffolding, and how the outputs are integrated into the working solution.                                                                                                                                         |

---

## 3. Originality Review Against 2025 Winners

Prior winners validate our stack and ambition, but our product must be visibly distinct.

### 2025 Patterns To Borrow

- Multiple specialized agents with visible intermediate outputs.
- Maestro as the system of coordination, not a passive backend.
- Document extraction plus validation.
- Human-in-the-loop approval for sensitive decisions.
- Data Service/Data Fabric audit records.
- Apps/Case App surfaces for operational visibility.
- Concrete business metrics and an architecture diagram.

### What Not To Copy

| Prior project pattern                      | Avoid copying                                                                                                              | Our differentiated version                                                                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| TrialIQ clinical-trial document validation | Do not frame around trial forms, adverse-event reports, informed consent forms, or drug-approval regulatory review.        | Post-prescription specialty-medication access: payer prior authorization, policy criteria, denial rescue, appeal, and pharmacy handoff. |
| Smart Health Claim Assistant               | Do not center on incoming claim emails, claim eligibility, dispense amount calculation, or insurance reimbursement filing. | Start from a treatment order and coordinate payer approval before care is delivered.                                                    |
| ClaimGuardian 360                          | Do not use accident FNOL, fraud scoring, KYC, image tampering, surveyor workflows, or auto-claim settlement.               | Use payer medical policy, chart evidence, clinician attestation, and treatment-continuity handoff.                                      |
| Generic document extraction demos          | Do not stop at extraction or validation.                                                                                   | Extraction drives case stage transitions, human gates, submissions, denials, appeals, and downstream care tasks.                        |

### Product Signature

The signature experience must be:

> "The system reads the payer rule, proves what is in the chart, asks the clinician only for accountable claims, submits through the available channel, rescues a denial with source-grounded appeal language, and hands the approved therapy to pharmacy."

No 2025 winner reviewed appears to use this exact prior-auth-to-denial-rescue-to-care-continuity loop.

---

## 4. Architectural Decision

Use a hybrid UI with UiPath-native execution surfaces.

### UI Surfaces

1. **Beautiful Command Center UI**
   - Preferred implementation: React/Next.js or equivalent polished web app.
   - Purpose: executive demo cockpit, case timeline, evidence matrix, agent trace, denial rescue, and care handoff.
   - Constraint: must read live state from records/events written by UiPath workflows, not from a local-only simulation.

2. **UiPath Case App / Maestro Instance View**
   - Purpose: prove live Maestro Case lifecycle, stages, SLA, case history, and task status.
   - Demo moment: show the same case in Maestro after starting it from intake.

3. **Action Center**
   - Purpose: clinician evidence approval, extraction validation if IXP is used, appeal signoff, exception review.
   - Demo moment: workflow pauses, action is completed, workflow resumes.

4. **Orchestrator**
   - Purpose: show jobs, assets, logs, robot portal fallback, and queue/status details.
   - Demo moment: payer API failure triggers robot job against mock payer portal.

### State Principle

The Command Center displays a live event stream and case snapshot. UiPath writes events after each material action:

- case created
- EHR data pulled
- policy extracted
- evidence mapped
- missing evidence found
- human task created/completed
- submission attempted
- API failed
- RPA fallback started/completed
- denial received
- appeal drafted
- appeal approved
- approval received
- pharmacy handoff completed
- audit packet generated

If direct Data Service external reads are slow to configure, use an **Audit/Event Mirror API** hosted in the repo. Every UiPath task calls it through API Workflow or HTTP connector. This makes the UI beautiful while keeping UiPath as the runtime source of truth.

---

## 5. Layer-Ordered Activation Checklist

Follow this before debugging symptoms. If a feature is missing, unavailable, or not listed, first check registration, discovery, install, and official activation flows.

### UiPath Tenant / Labs

- Confirm UiPath Labs access email and tenant URL.
- Confirm organization and folder.
- Confirm Automation Cloud region.
- Confirm user roles for Studio Web, Maestro, Agent Builder, Action Center, Data Service/Data Fabric, Integration Service, Orchestrator, Apps, and IXP/Document Understanding.
- Confirm AI units / agent access available in Labs.
- Confirm licensing/permissions for Action Center.

### Maestro Case

- Confirm Maestro is available in the tenant.
- Confirm Case Management is available, not only BPMN.
- Confirm ability to create a case project in Studio Web.
- Confirm Case App or Case Instance Management can show case state/timeline.
- Confirm a simple case can be published/deployed.

### Agent Builder

- Confirm Agent Builder is available in Studio Web.
- Confirm agents can be deployed and called from Maestro tasks.
- Confirm tool nodes can call API workflows or connectors.
- Confirm traces are visible for debug/demo proof.
- Confirm escalation nodes can create human tasks if needed.

### IXP / Document Understanding

- Confirm whether IXP is available as an Agent Builder tool in the Labs platform.
- Confirm ability to create or access an IXP project.
- Confirm a published model can receive a staging/live deployment tag.
- Confirm file inputs can be passed from the agent.
- Confirm Document Validation Station can create Action Center tasks.
- If any item fails, use fallback extraction while documenting IXP as the intended production path.

### Action Center

- Confirm action catalogs exist or can be created.
- Confirm user groups have Actions, Action Assignment, Action Self Assignment, and Action Catalog permissions.
- Confirm assigned clinician/reviewer account has signed in at least once.
- Confirm a workflow can create an action, pause, and resume after completion.

### API Workflows / Integration Service

- Confirm API Workflow project creation in Studio Web.
- Confirm HTTP calls to mock EHR/payer/pharmacy/event endpoints.
- Confirm secret/API key storage in Orchestrator assets or environment variables.
- Confirm workflows can be called from Maestro and agents.

### Orchestrator / Studio Robot

- Confirm folder, machine/runtime, unattended/attended robot availability as needed.
- Confirm robot package publishing.
- Confirm browser automation can reach the deployed mock payer portal.
- Confirm job logs are visible and tied to the case ID.

---

## 6. Target Repo Structure

Create a repo from this folder before launching parallel worktrees.

```text
.
|-- AGENTS.md
|-- README.md
|-- LICENSE
|-- package.json
|-- pnpm-workspace.yaml
|-- treatment_access_command_center_final_build_spec.md
|-- treatment_access_command_center_implementation_plan.md
|-- apps/
|   |-- command-center/
|   |   |-- src/app/
|   |   |-- src/components/
|   |   |-- src/lib/
|   |   `-- tests/
|   `-- mock-payer-portal/
|       |-- src/app/
|       |-- src/components/
|       `-- tests/
|-- services/
|   `-- mock-healthcare-api/
|       |-- src/
|       |-- test/
|       `-- openapi/
|-- packages/
|   |-- shared-schemas/
|   |   |-- src/
|   |   `-- test/
|   `-- demo-data/
|       |-- patients/
|       |-- policies/
|       |-- notes/
|       |-- labs/
|       |-- denials/
|       `-- scripts/
|-- uipath/
|   |-- maestro/
|   |-- agents/
|   |-- api-workflows/
|   |-- action-center/
|   |-- data-service/
|   |-- robots/
|   `-- screenshots/
|-- docs/
|   |-- architecture.md
|   |-- demo-script.md
|   |-- setup-uipath.md
|   |-- testing.md
|   |-- submission.md
|   `-- orchestration-log.md
`-- scripts/
    |-- seed-demo-data.*
    |-- reset-demo.*
    `-- verify-demo.*
```

### Stack Recommendation

- TypeScript monorepo for speed and shared schemas.
- React/Next.js or Vite React for Command Center and mock payer portal.
- Node/Fastify or Next API routes for mock EHR, payer, pharmacy, document, and event mirror endpoints.
- Zod or JSON Schema for all case/agent/API contracts.
- Playwright for UI smoke tests.
- Lightweight seeded JSON/PDF/Markdown fixtures for reproducible live flows.

---

## 7. Data And Contract Model

Use one set of shared schema definitions for the custom UI, mock APIs, agent input/output contracts, and UiPath handoff documentation.

### Core Entities

Extend the PRD data model with provenance and runtime fields:

- `TreatmentAccessCase`
  - `case_id`
  - `external_case_key`
  - `maestro_case_id`
  - `patient_id`
  - `order_id`
  - `payer_id`
  - `service_type`
  - `medication_name`
  - `urgency`
  - `status`
  - `current_stage`
  - `active_secondary_stages`
  - `sla_due_at`
  - `sla_state`
  - `outcome`
  - `last_event_at`

- `PolicyCriterion`
  - `criterion_id`
  - `policy_id`
  - `description`
  - `required_evidence_type`
  - `severity`
  - `must_be_clinician_attested`
  - `policy_citation`
  - `source_span`
  - `version`

- `EvidenceArtifact`
  - `artifact_id`
  - `case_id`
  - `type`
  - `source_uri`
  - `display_name`
  - `extracted_text`
  - `structured_fields`
  - `extraction_method`
  - `extraction_confidence`
  - `source_hash`

- `EvidenceMapping`
  - `mapping_id`
  - `case_id`
  - `criterion_id`
  - `artifact_id`
  - `status`
  - `evidence_summary`
  - `source_quote_short`
  - `source_span`
  - `confidence`
  - `needs_human_review`
  - `human_review_reason`
  - `reviewer_decision`
  - `reviewer_original_text`
  - `reviewer_final_text`
  - `reviewer_id`
  - `reviewed_at`

- `SubmissionAttempt`
  - `attempt_id`
  - `case_id`
  - `packet_id`
  - `channel`
  - `status`
  - `started_at`
  - `completed_at`
  - `payload_summary`
  - `response_summary`
  - `orchestrator_job_id`
  - `portal_confirmation_id`
  - `error_code`
  - `retry_count`

- `PayerDecision`
  - `decision_id`
  - `case_id`
  - `submission_attempt_id`
  - `status`
  - `reason`
  - `denial_code`
  - `policy_citation`
  - `appeal_deadline`
  - `raw_response`
  - `source_artifact_id`

- `AppealPacket`
  - `appeal_id`
  - `case_id`
  - `denial_reason`
  - `appeal_strategy`
  - `evidence_used`
  - `draft_text`
  - `unsupported_claim_warnings`
  - `clinician_approved`
  - `clinician_edits`
  - `submitted_at`
  - `version`

- `AuditEvent`
  - `event_id`
  - `case_id`
  - `maestro_case_id`
  - `actor_type`
  - `actor_name`
  - `task_or_agent_name`
  - `action`
  - `input_summary`
  - `output_summary`
  - `evidence_refs`
  - `trace_id`
  - `orchestrator_job_id`
  - `timestamp`

### Event Mirror API

The custom UI must consume these live endpoints:

- `POST /events` - called by UiPath after each task.
- `GET /cases` - case list.
- `GET /cases/:caseId` - case snapshot.
- `GET /cases/:caseId/events` - audit timeline.
- `GET /cases/:caseId/evidence-matrix` - policy-to-evidence matrix.
- `GET /cases/:caseId/agent-traces` - sanitized trace summaries.
- `POST /demo/reset` - reset local mock data.
- `POST /demo/toggles` - set missing lab / payer API unavailable / denial reason / clinician rejection demo modes.

The event API stores synthetic data only.

---

## 8. UiPath Case Design

### Primary Stages

| Stage                      | Purpose                                                           | Entry                                                           | Complete                                             | Exit / re-entry                                                                                |
| -------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Intake & Hydration         | Create case, pull patient/order/coverage, attach docs.            | Case created from UiPath Apps, Case App, or custom UI trigger.  | Patient snapshot, order, payer, and docs registered. | Re-enter if upstream order data changes.                                                       |
| Policy & Evidence Assembly | Extract payer policy and map chart evidence.                      | Intake complete.                                                | Criteria checklist and evidence matrix exist.        | Exit to Missing Evidence if blocking gaps exist. Re-enter after clinician/staff supplies data. |
| Clinical Validation        | Clinician reviews medical assertions.                             | Evidence matrix has `needs_human_review` or high-impact claims. | Required assertions approved/edited/rejected.        | Re-enter Policy & Evidence if rejected or more evidence requested.                             |
| Submission                 | Build packet, submit via API, fallback to portal robot if needed. | Required criteria satisfied and human gates complete.           | Submission attempt completed.                        | Exit to API Failure / Portal Fallback secondary stage on API outage.                           |
| Payer Decision             | Wait for response, parse decision.                                | Submission completed.                                           | Decision parsed as approved/denied/RFI.              | If denied/RFI, activate Denial Rescue / Appeal.                                                |
| Approval & Care Continuity | After approval, create pharmacy/scheduling handoff.               | Payer approved or appeal approved.                              | Pharmacy/scheduling handoff completed.               | Re-enter if handoff API fails.                                                                 |
| Closure & Audit            | Generate final audit packet and outcome metrics.                  | Care handoff complete or case cancelled.                        | Audit summary generated and case outcome set.        | Case complete.                                                                                 |

### Secondary Stages

| Stage                         | Trigger                                                              | Behavior                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Missing Evidence              | Evidence matrix has blocking missing criterion.                      | Create task for PA specialist/nurse/clinician, pause submission, return to Policy & Evidence Assembly when resolved. |
| API Failure / Portal Fallback | Mock payer API returns unavailable.                                  | Launch Orchestrator robot to fill mock payer portal. Record job ID and confirmation.                                 |
| Denial Rescue / Appeal        | Payer decision status is denied or RFI.                              | Parse denial, map reason to missing/contested criterion, draft appeal, route clinician signoff, submit appeal.       |
| Clinician Rework              | Clinician rejects or edits high-impact assertion.                    | Remove unsupported claim, rebuild evidence mapping or packet, require reapproval.                                    |
| SLA At Risk                   | Case/stage SLA warning fires.                                        | Notify coordinator, raise urgency badge, create optional manager task.                                               |
| Human Exception Review        | Low confidence extraction, contradictory evidence, repeated failure. | Create Action Center task for human resolution.                                                                      |

### Task Types To Demonstrate

- AI Agent tasks: seven domain agents.
- API Workflow tasks: EHR pull, payer submission, decision fetch, pharmacy handoff, event mirror write.
- Human Action tasks: clinician evidence approval, appeal signoff, exception review.
- RPA Workflow task: mock payer portal fallback.
- Wait/Timer or Connector Event task: payer response delay simulation.
- Data Fabric/Data Service operations: case state, evidence, decisions, audit records.

---

## 9. Agent Design

Keep seven agents. Each must own a distinct output and a visible UI trace.

### 1. Coverage Requirement Agent

- Input: patient coverage, order, payer policy document/file/text.
- Tools: IXP/DU or fallback extractor, policy lookup API, schema validator.
- Output:
  - `authorization_required`
  - `submission_channels`
  - `criteria[]`
  - `required_documents[]`
  - `policy_citations[]`
- Writes: `PayerPolicy`, `PolicyCriterion`, audit event.
- Demo proof: policy criteria list appears, with citations and source spans.

### 2. Evidence Retrieval Agent

- Input: criteria, patient snapshot, progress note, labs, medication history, safety screening.
- Tools: mock EHR API, document extractor, context grounding or deterministic search.
- Output:
  - evidence matrix rows for each criterion.
  - source references.
  - confidence.
  - conflicting/missing flags.
- Writes: `EvidenceArtifact`, `EvidenceMapping`, audit event.
- Demo proof: policy-to-evidence matrix changes when toggles change.

### 3. Missing Evidence Agent

- Input: evidence matrix and case urgency.
- Tools: role-routing rules, task creator, notification workflow.
- Output:
  - blocking gaps.
  - role assignment.
  - exact human task prompt.
  - due date / SLA impact.
- Writes: `HumanTask`, secondary stage activation, audit event.
- Demo proof: missing TB/hepatitis screen creates a nurse/clinician task instead of submitting.

### 4. Submission Packet Agent

- Input: validated evidence matrix, payer form schema, clinician decisions.
- Tools: packet builder workflow, unsupported-claim checker.
- Output:
  - structured form fields.
  - attachment list.
  - cover letter.
  - risk warnings.
  - `ready_to_submit`.
- Writes: `SubmissionPacket`, audit event.
- Demo proof: packet preview only includes approved/source-backed claims.

### 5. Denial Rescue Agent

- Input: payer denial response/letter and original submission.
- Tools: IXP/DU or fallback denial parser, evidence compare workflow.
- Output:
  - denial reason.
  - denial code.
  - appeal deadline.
  - missing/contested criterion.
  - recommended appeal strategy.
- Writes: `PayerDecision`, denial analysis, audit event.
- Demo proof: denial reason toggle changes the appeal focus.

### 6. Appeal Packet Agent

- Input: denial analysis, evidence matrix, clinician notes, policy citations.
- Tools: appeal drafting workflow, evidence citation validator, Action Center signoff.
- Output:
  - administrative appeal draft.
  - evidence citations.
  - unsupported-claim warnings.
  - clinician approval task.
- Writes: `AppealPacket`, `HumanTask`, audit event.
- Demo proof: appeal draft is regenerated from denial/evidence and cannot be submitted until clinician approves.

### 7. Care Continuity Agent

- Input: approval decision, treatment order, pharmacy requirements.
- Tools: mock pharmacy API, scheduling API, coordinator task.
- Output:
  - pharmacy handoff record.
  - scheduling task.
  - coordinator notification.
  - closure readiness.
- Writes: care handoff record, audit event.
- Demo proof: approval triggers downstream task; case does not end at payer approval.

### Cross-Cutting Audit/Compliance Logic

Implement as deterministic validators first; optionally expose as an 8th agent if time allows.

- Detect unsupported clinical claims.
- Confirm every criterion has source/human decision.
- Confirm every task has actor/timestamp.
- Confirm no real PHI.
- Generate final audit packet.

---

## 10. Extraction Strategy

### Preferred Path

Use IXP/Document Understanding where the Labs tenant supports it.

Required document classes:

- payer policy
- progress note
- lab report
- safety screening
- denial letter

Required extracted field groups:

- policy criteria and citations
- diagnosis/severity/supporting statements
- prior therapy failures and dates
- lab values and dates
- TB/hepatitis screening status
- denial reason/code/deadline

### Reliable Fallback

If IXP activation/model setup blocks progress:

- Keep documents synthetic and deterministic.
- Store source documents as Markdown/text/PDF.
- Use API Workflow/custom parser to extract structured fields at runtime.
- Preserve `extraction_method = "fallback_parser"` and `source_span`.
- Keep the same Data Service/event schema so later IXP swap is low risk.

### Demo Requirement

At least one extraction must be visibly runtime-processed. It can be fallback parser if IXP is unavailable, but the plan should include IXP screenshots/traces if available.

---

## 11. Mock Systems

### Mock EHR API

Endpoints:

- `GET /patients/:id`
- `GET /patients/:id/orders/:orderId`
- `GET /patients/:id/medication-history`
- `GET /patients/:id/documents`
- `GET /documents/:documentId`
- `POST /patients/:id/labs/safety-screening`

Behavior:

- Returns synthetic FHIR-like JSON.
- Supports missing safety lab toggle.
- Supports clinician-added note/evidence.

### Mock Payer API

Endpoints:

- `POST /payer/prior-auth`
- `GET /payer/prior-auth/:submissionId/status`
- `POST /payer/appeals`
- `GET /payer/appeals/:appealId/status`

Behavior:

- Supports API unavailable toggle.
- Supports denial reason toggle.
- First submission can deny or RFI based on demo mode.
- Appeal approval is generated only after appeal submission.

### Mock Payer Portal

Requirements:

- Browser-accessible portal UI.
- Login screen with demo credentials from Orchestrator asset/env.
- Prior authorization form fields.
- File upload placeholders.
- Submit button and confirmation ID.
- Stable selectors for Studio robot.
- Visual enough to show RPA value, but not the center of the product.

### Mock Pharmacy / Scheduling API

Endpoints:

- `POST /pharmacy/handoffs`
- `GET /pharmacy/handoffs/:handoffId`
- `POST /scheduling/tasks`

Behavior:

- Creates downstream care handoff after approval.
- Returns coordinator task ID/status.

---

## 12. Command Center UX Plan

The UI should feel like a polished operational command center, not a landing page.

### Main Views

1. **Case Queue**
   - Status, stage, patient initials/synthetic name, medication, payer, SLA state, pending human tasks, latest event.

2. **Case Detail**
   - Header: case status, current stage, SLA countdown, risk badges.
   - Stage rail: intake, evidence, validation, submission, decision, appeal, care handoff, audit.
   - Agent trace strip: seven agents with last output/status.

3. **Evidence Matrix**
   - Rows: payer criteria.
   - Columns: status, evidence summary, source, confidence, human review, decision.
   - Source drawer with short excerpts and artifact metadata.

4. **Human Review Panel**
   - Mirrors Action Center state.
   - Shows pending clinician assertions and appeal signoff status.
   - Does not replace Action Center in the demo; use it as visibility.

5. **Submission & Denial Rescue**
   - Payer API attempt card.
   - RPA fallback job card.
   - Denial reason, deadline, appeal strategy.
   - Appeal draft preview with citations and approval state.

6. **Care Continuity**
   - Pharmacy handoff.
   - Scheduling task.
   - Patient access coordinator notification.

7. **Audit Timeline**
   - Filter by actor: agent, API, robot, human, system.
   - Each event shows timestamp, task/agent, input summary, output summary, trace/job IDs.

### Visual Standards

- Dense but elegant enterprise UI.
- Avoid a marketing hero page.
- Use restrained color with semantic accents: green approved, amber at-risk, red denied/blocking, blue active.
- Use icons for action buttons.
- Build empty/loading/error states.
- Show live updating state after every UiPath event.
- Keep all patient data synthetic and clearly labeled.

---

## 13. Demo Scenarios

### Scenario A - Denial Rescue Golden Path

1. Start case for synthetic patient and biologic order.
2. Pull EHR/order data.
3. Parse payer policy into criteria.
4. Map diagnosis, severity, prior therapy, labs, and safety screening.
5. Clinician approves high-impact assertions.
6. API submission succeeds.
7. Payer denies for step therapy.
8. Denial Rescue Agent maps denial to prior therapy evidence.
9. Appeal Packet Agent drafts appeal.
10. Clinician approves appeal.
11. Appeal approved.
12. Pharmacy handoff created.
13. Audit packet generated.

### Scenario B - Missing Safety Lab

1. Toggle missing TB/hepatitis screening.
2. Evidence Retrieval Agent marks safety criterion Missing.
3. Missing Evidence Agent creates Action Center task.
4. Submission blocked.
5. User supplies/reviews missing safety screen.
6. Case re-enters evidence assembly and proceeds.

### Scenario C - API Unavailable / RPA Fallback

1. Toggle payer API unavailable.
2. Submission API attempt fails with recorded error.
3. API Failure / Portal Fallback secondary stage activates.
4. Orchestrator starts Studio robot.
5. Robot fills mock payer portal and records confirmation.
6. Case proceeds to payer decision.

### Scenario D - Clinician Rejects Unsupported Claim

1. Toggle clinician rejection.
2. Clinician rejects a generated assertion.
3. Submission Packet Agent removes claim.
4. Evidence matrix and packet update.
5. Case requests more evidence or proceeds with revised language.

---

## 14. Checkpoint Plan For Worktree Orchestration

Do not launch all checkpoints at once. Each checkpoint must be merged, reviewed, and verified before the next starts.

### Checkpoint 0 - Repo And Execution Baseline

**Outcome:** The project is a git repo with runnable skeleton, shared conventions, local dev commands, seed/reset scripts stubbed, and an orchestration log.

**Lanes:**

1. **Repo/Foundation Lane**
   - Owns: root package files, workspace setup, AGENTS.md, README skeleton, LICENSE.
   - Output: install/build/dev commands and repo conventions.

2. **Contracts/Data Lane**
   - Owns: `packages/shared-schemas`, `packages/demo-data`.
   - Output: core Zod/JSON schemas and synthetic seed data.

3. **Docs/UiPath Setup Lane**
   - Owns: `docs/setup-uipath.md`, `uipath/*/README.md`.
   - Output: activation checklist, required services, environment variables, setup order.

**Verification:**

- `git status --short`
- package install
- typecheck or schema tests
- seed/reset script dry run
- docs link check by inspection

### Checkpoint 1 - Mock Runtime And Live State Backbone

**Outcome:** UiPath can call live mock endpoints and the Command Center can display event-backed case state.

**Lanes:**

1. **Mock Healthcare API Lane**
   - Owns: `services/mock-healthcare-api`.
   - Builds EHR, payer, pharmacy, event mirror endpoints.
   - Adds OpenAPI docs and tests.

2. **Demo Data & Fixture Lane**
   - Owns: `packages/demo-data`.
   - Builds synthetic patient, policy, note, labs, denial letters, toggles.
   - Ensures no real PHI and no borrowed copyrighted clinical docs.

3. **Command Center Data Shell Lane**
   - Owns: `apps/command-center`.
   - Builds case queue/detail UI wired to event mirror API.
   - Uses seeded state and live polling/SSE/websocket if feasible.

4. **QA/Reset Lane**
   - Owns: `scripts/reset-demo.*`, `scripts/verify-demo.*`, tests.
   - Adds local smoke checks.

**Verification:**

- API tests pass.
- Command Center shows seeded case.
- Reset returns clean state.
- Toggle changes evidence/denial/API behavior through API, not hardcoded UI.

### Checkpoint 2 - UiPath Core Case Integration

**Outcome:** A real Maestro Case can be created, hydrated, advanced through policy/evidence/human-review/submission stages, and its state is mirrored into the Command Center.

**Lanes:**

1. **Maestro/Data Service Lane**
   - Owns: `uipath/maestro`, `uipath/data-service`.
   - Defines case stages, secondary stages, case entity fields, Data Service entities.
   - Documents exact field ownership and stage rules.

2. **API Workflows Lane**
   - Owns: `uipath/api-workflows`.
   - Builds workflows for EHR pull, event mirror write, payer submit, decision fetch, pharmacy handoff.
   - Uses Orchestrator assets/env for endpoints/secrets.

3. **Action Center Lane**
   - Owns: `uipath/action-center`.
   - Builds clinician evidence approval and appeal signoff actions.
   - Documents catalogs, groups, permissions, assignment.

4. **UiPath Apps / Intake Lane**
   - Owns: `uipath/apps` if used, plus docs.
   - Builds intake surface or documents Case App launch flow.
   - Must start a real case, not just write local UI state.

**Verification:**

- Create one case from UiPath.
- Mock EHR API receives request.
- Event mirror receives UiPath events.
- Action Center task pauses/resumes workflow.
- Command Center reflects live stage changes.

### Checkpoint 3 - Seven Agents And Extraction

**Outcome:** Seven agents run in the case flow, produce structured outputs, write audit events, and drive different case paths.

**Lanes:**

1. **Policy/Evidence/Missing Evidence Agents Lane**
   - Owns: Coverage Requirement Agent, Evidence Retrieval Agent, Missing Evidence Agent.
   - Builds prompt/tool/schema docs, Agent Builder configuration notes, debug examples.
   - Wires extraction fallback and source-span preservation.

2. **Submission/Denial/Appeal Agents Lane**
   - Owns: Submission Packet Agent, Denial Rescue Agent, Appeal Packet Agent.
   - Builds packet schema, denial parser, appeal draft constraints, unsupported-claim warnings.

3. **Care Continuity/Audit Lane**
   - Owns: Care Continuity Agent and audit/compliance validators.
   - Builds pharmacy handoff logic and final audit packet.

4. **IXP/DU Lane**
   - Owns: `uipath/agents/extraction`, `docs/setup-uipath.md` extraction section.
   - Attempts IXP/DU activation and at least one working extraction path.
   - If unavailable, documents exact blocker and validates fallback parser.

**Verification:**

- Agent debug traces/summaries captured.
- Each agent writes distinct output fields.
- Evidence matrix is generated at runtime.
- Missing lab toggle blocks submission.
- Denial reason toggle changes appeal strategy.
- No autonomous medical claims without clinician approval.

### Checkpoint 4 - RPA Portal Fallback And Beautiful Demo UX

**Outcome:** Payer API failure launches a real UiPath robot against a mock portal, and the UI is polished enough for a judge-facing walkthrough.

**Lanes:**

1. **Mock Payer Portal Lane**
   - Owns: `apps/mock-payer-portal`.
   - Builds stable login/form/confirmation pages for robot automation.

2. **Studio Robot Lane**
   - Owns: `uipath/robots`.
   - Builds portal submission robot with robust selectors, logging, screenshots if feasible.
   - Records confirmation ID and job ID.

3. **Command Center UX Lane**
   - Owns: `apps/command-center`.
   - Builds final dashboard views: evidence matrix, agent traces, timeline, denial rescue, care handoff, demo controls.

4. **Integration QA Lane**
   - Owns: Playwright/smoke tests and demo verification scripts.
   - Tests API failure -> robot fallback -> event mirror -> UI state.

**Verification:**

- Toggle API unavailable.
- Orchestrator job starts.
- Robot fills portal and submits.
- Portal confirmation appears in SubmissionAttempt.
- Command Center and Maestro show fallback path.

### Checkpoint 5 - Submission Package And Production Readiness

**Outcome:** The project is ready for Devpost: repo, README, screenshots, video script, deck outline, setup docs, and live demo checklist.

**Lanes:**

1. **README/Submission Lane**
   - Owns: README, `docs/submission.md`, license checklist.
   - Documents UiPath components, setup, prerequisites, agent types, coding-agent usage evidence.

2. **Demo Script/Deck Lane**
   - Owns: `docs/demo-script.md`, deck outline, architecture diagram.
   - Five-minute script with exact screen transitions.

3. **Evidence Capture Lane**
   - Owns: `uipath/screenshots`, docs screenshots/video checklist.
   - Captures UiPath Apps/Case App, Maestro, Action Center, Orchestrator, agent traces, Command Center.

4. **Final QA Lane**
   - Owns: `docs/testing.md`, final verification.
   - Runs reset, all scenario smoke tests, build/typecheck/lint where available, safety/privacy scan.

**Verification:**

- GitHub repo complete.
- Demo runs from reset.
- No real PHI.
- README lists mocked vs live components.
- Demo video shows solution running, architecture, agents, orchestration, and humans.
- Coding agent bonus documentation included.

---

## 15. Worktree Lane Prompt Template

Use this template when launching lanes through the orchestration workflow.

```text
You are the <checkpoint> <lane name> implementation lane for Treatment Access Command Center.

Read first:
- AGENTS.md
- treatment_access_command_center_final_build_spec.md
- treatment_access_command_center_implementation_plan.md
- docs/setup-uipath.md if present
- docs/orchestration-log.md if present

Base state:
- Branch: <branch>
- Base commit: <commit>
- Worktree path: <path>

Goal:
<specific checkpoint/lane outcome>

Ownership:
- You may edit: <paths>
- Coordinate or avoid: <shared files/contracts>
- Do not edit: <forbidden paths>

Implementation requirements:
- UiPath must remain the orchestration/governance layer.
- Do not replace live UiPath flow with local-only UI state.
- Preserve synthetic-data-only privacy.
- Every clinical assertion must have source evidence or human approval.
- Any unavailable UiPath feature must be documented with activation/discovery status before fallback.

Verification:
- Run: <commands>
- If a command cannot run, explain why and run the closest safe check.

Handoff:
Report files changed, commands run, tests passing/failing, risks, env notes, contract changes, UiPath setup notes, and integration instructions.
```

---

## 16. Merge And Review Policy

Merge order per checkpoint:

1. Schemas/contracts/data.
2. Mock APIs/runtime services.
3. UiPath workflow/docs that depend on contracts.
4. UI consuming stable contracts.
5. QA/docs/submission materials.

Before merging a lane:

- Inspect diff and changed files.
- Confirm no unrelated generated artifacts.
- Confirm no real PHI or secrets.
- Confirm contracts match shared schemas.
- Confirm unavailable-state handling is honest.
- Confirm tests/checks ran or are explicitly blocked.

After each checkpoint:

- Run targeted checks.
- Update `docs/orchestration-log.md`.
- Record remaining risks.
- Do not launch the next checkpoint until integration is stable enough for the scope.

---

## 17. Verification Matrix

| Capability       | Automated check                     | Manual demo check                                       |
| ---------------- | ----------------------------------- | ------------------------------------------------------- |
| Reset            | `scripts/reset-demo.*`              | Case queue returns to clean seed state.                 |
| Mock APIs        | API tests                           | UiPath API Workflow receives valid responses.           |
| Evidence mapping | schema/unit tests                   | Matrix changes with missing lab toggle.                 |
| Human approval   | contract test / workflow smoke      | Action Center pauses and resumes case.                  |
| Submission API   | integration test                    | Submission ID appears in case and UI.                   |
| RPA fallback     | Playwright portal smoke + robot run | Orchestrator job fills portal and returns confirmation. |
| Denial rescue    | parser/agent output test            | Appeal strategy changes with denial reason toggle.      |
| Appeal signoff   | workflow smoke                      | Appeal cannot submit before clinician approval.         |
| Care handoff     | API test                            | Pharmacy task appears after approval.                   |
| Audit trail      | event count/schema checks           | Timeline shows agent/API/robot/human events.            |
| Safety/privacy   | text scan + fixture review          | UI clearly marks synthetic data; no real PHI.           |

---

## 18. Critical Risks And Mitigations

| Risk                                                                | Mitigation                                                                                                                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Labs tenant missing IXP or Agent Builder tool access                | Verify activation first. Use fallback parser with same schema. Document blocker and intended IXP path.                                                                    |
| Action Center assignment fails                                      | Verify user/group/action catalog permissions and reviewer login early. Use UiPath Apps approval only as emergency fallback, but still document Action Center attempt.     |
| Maestro Case availability differs from docs                         | Verify case project creation early. If Case App is limited, still use Maestro process/case runtime and show instance management.                                          |
| Custom UI becomes the apparent product while UiPath looks bolted on | Start demo in UiPath or show UiPath case immediately after launch. Display Maestro/Action Center/Orchestrator during core moments. Ensure UI reads UiPath-written events. |
| Too many agents feel decorative                                     | Each agent has unique schema output, case-field ownership, and UI trace. Do not create agent names without runtime outputs.                                               |
| RPA fallback consumes too much time                                 | Build API path first. Robot only needs stable portal form submission with confirmation ID, not a full payer UX.                                                           |
| Appeal text suggests medical/legal advice                           | Label as administrative draft for clinician review. Block submission until clinician signoff.                                                                             |
| Production-readiness claims overreach                               | Say live synthetic prototype with production-style architecture. Be clear about mocked EHR/payer/pharmacy systems.                                                        |

---

## 19. Definition Of Done

The implementation is demo-ready when:

- A case can be created from a UiPath-controlled entry point.
- Maestro Case manages the lifecycle with primary and secondary stages.
- All seven agents run and produce distinct structured outputs.
- The evidence matrix is generated at runtime from policy/chart/doc fixtures.
- Action Center creates at least two real human gates: evidence validation and appeal signoff.
- Payer API submission executes live.
- Payer API unavailable toggle triggers a real Orchestrator robot against the mock portal.
- Denial letter/response parsing changes appeal output.
- Appeal approval leads to payer approval.
- Approval triggers pharmacy/scheduling handoff.
- Audit timeline records agents, APIs, robot, humans, and exceptions.
- Command Center UI is polished and reflects live event-backed state.
- README/setup/docs clearly explain UiPath components, mocked systems, synthetic data, and coding-agent contribution.
- Demo video can be completed in under five minutes.

---

## 20. Source Notes

Use these in README/deck citations:

- UiPath AgentHack overview: https://uipath-agenthack.devpost.com/
- UiPath AgentHack rules and judging criteria: https://uipath-agenthack.devpost.com/rules
- UiPath AgentHack resources: https://uipath-agenthack.devpost.com/resources
- Maestro Case documentation: https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/introduction-to-maestro-case
- Agent Builder documentation: https://docs.uipath.com/agents/automation-cloud/latest/user-guide/building-an-agent-in-studio-web
- IXP as an agent tool: https://docs.uipath.com/agents/automation-cloud/latest/user-guide/ixp
- API Workflows documentation: https://docs.uipath.com/studio-web/automation-cloud/latest/user-guide/about-api-workflows
- Action Center documentation: https://docs.uipath.com/action-center/automation-cloud/latest/user-guide/introduction
- 2025 winners blog: https://www.uipath.com/community-blog/community-news/uipath-community-annual-global-hackathon-2025
- TrialIQ reference: https://forum.uipath.com/t/trialiq-accelerating-drug-approvals-with-multi-agent-clinical-regulatory-intelligence/2878655
- Smart Health Claim Assistant reference: https://forum.uipath.com/t/smart-health-claim-assistant/2878374
- ClaimGuardian 360 reference: https://forum.uipath.com/t/claimguardian-360/2878706
