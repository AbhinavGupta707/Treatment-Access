# Treatment Access Command Center — Build-Ready PRD / Product Spec

**Hackathon:** UiPath AgentHack 2026
**Submission track:** Track 1 — UiPath Maestro Case
**Recommended submission title:** Treatment Access Command Center
**Primary demo scenario:** Specialty medication prior authorization with denial rescue
**Build stance:** live, functioning synthetic-data system; not cached outputs or a UI-only shell
**Version:** Final build-start spec, 2026-06-28

---

## 0. Executive Decision

Build this as a **dynamic treatment-access case-management system**. The demo should show a patient being moved from “treatment ordered” to “payer approved” through live UiPath orchestration: policy extraction, evidence mapping, clinician signoff, payer submission, denial handling, appeal generation, and downstream pharmacy/treatment coordination.

The product should not be framed as “AI fills prior authorization forms.” The stronger framing is:

> Prior authorization is a treatment-access orchestration problem. We coordinate payer rules, clinical evidence, humans, payer portals, denials, appeals, and downstream care delivery as one governed UiPath Maestro Case.

This project is substantially different from the Governed Agentic Automation Factory and should be submitted separately under **Maestro Case**.

---

## 1. Hackathon Fit

### Why Track 1: Maestro Case

This workflow is not linear. The route changes depending on missing evidence, payer response, medical urgency, human review, denial reason, appeal deadline, and portal/API failures. That is exactly the profile for **Maestro Case** rather than BPMN.

The solution should demonstrate:

- Dynamic case stages.
- Multiple agents.
- Robots and APIs.
- Humans in the loop.
- Long-running work.
- Exception paths.
- Auditability and control.
- Real UiPath Automation Cloud execution.

### Judging-criteria optimization

| Criterion | How we intentionally score |
|---|---|
| Business impact | Prior authorization delays care and consumes staff time; value is immediately understandable. |
| Platform usage | Maestro Case, Agent Builder, IXP, Action Center, Apps, Data Service, Integration Service, Studio/Studio Web, Orchestrator, API Workflows. |
| Technical execution | Live extraction, source-grounded evidence mapping, API/RPA dual submission, denial-to-appeal flow, retries, human gates, audit logs. |
| Completeness | End-to-end working prototype using synthetic but runtime-processed data. |
| Creativity | Reframes prior auth as treatment-access command center, not form automation. |
| Presentation | Strong patient story in under five minutes. |
| Bonus | Optional: use Codex/UiPath Coding Agents to generate mock portal robot, tests, seed data, or setup scripts. |

---

## 2. Product Problem

Clinics and specialty practices lose time because prior authorization requires staff to interpret payer policies, find evidence in charts, chase missing documents, fill payer portals, wait for decisions, handle denials, draft appeals, and coordinate care after approval. The expensive part is not just form completion; it is fragmented case orchestration.

The system should answer:

1. Does this treatment require prior authorization?
2. Which payer criteria apply?
3. What evidence exists in the chart?
4. What is missing or contradictory?
5. Which human must validate medical claims?
6. Can we submit electronically?
7. If not, can a UiPath robot submit through a portal?
8. What happened after submission?
9. If denied, why?
10. Can we produce a source-grounded appeal?
11. Once approved, what needs to happen so the patient actually receives treatment?

---

## 3. Demo Scenario: Specialty Medication Prior Authorization With Denial Rescue

### Patient story

A synthetic patient with moderate-to-severe inflammatory bowel disease is prescribed a specialty biologic medication. The payer requires evidence of diagnosis, disease severity, prior therapy failure, recent labs, infection screening, and clinician attestation.

The first submission is denied because one required criterion is incomplete. The system extracts the denial reason, identifies the missing evidence, routes a clinician task, rebuilds the appeal packet, resubmits, receives approval, and triggers specialty pharmacy coordination.

### Why this scenario is stronger than MRI

| Scenario | Strength | Weakness |
|---|---|---|
| MRI prior authorization | Easy to understand | Less distinctive; can look like basic form filling. |
| Specialty medication authorization | Rich policy logic, prior therapy, lab requirements, denial rescue, pharmacy coordination | Slightly more complex, but much more impressive. |

### Required synthetic assets

| Asset | Format | Purpose | Live processing requirement |
|---|---|---|---|
| Patient record | FHIR-like JSON / mock EHR API | Demographics, insurance, diagnosis, order | Pulled by workflow/API, not hardcoded into UI. |
| Specialist progress note | PDF or text | Diagnosis, severity, symptoms, clinical rationale | Parsed or read by extraction/evidence agent. |
| Medication history | JSON/CSV/PDF | Tried/failed therapies and dates | Mapped to step-therapy criteria. |
| Lab report | PDF/CSV | CRP/calprotectin/CBC or equivalent support | Used where policy requires labs. |
| TB/hepatitis screening | PDF/CSV | Common biologic safety prerequisite | Used as missing/available toggle. |
| Payer medical policy | PDF/HTML/Markdown | Defines authorization criteria | Extracted into structured checklist. |
| Prior auth form / portal | Mock web portal + optional API | Submission destination | Filled by API Workflow or UiPath robot. |
| Denial letter | PDF/email/API payload | Denial reason, deadline, appeal route | Parsed live and used to change case path. |
| Specialty pharmacy endpoint | Mock API/table | Downstream care coordination | Updated after approval. |

---

## 4. Live Functionality Contract

The demo can use synthetic data and mock systems, but the product must behave as a real running system.

### Must be live

| Flow element | Required live behavior |
|---|---|
| Case creation | User starts a new case from UiPath Apps or a mock EHR event. |
| Data pull | Workflow pulls patient/order/coverage data from mock EHR JSON/API. |
| Policy parsing | Payer policy is parsed into criteria at runtime. |
| Evidence mapping | Evidence matrix is generated from current documents/data. |
| Missing evidence | If evidence is absent, the case blocks or escalates. |
| Human approval | Action Center task genuinely pauses and resumes workflow. |
| Submission | Mock payer API call or UiPath robot portal submission executes. |
| Denial handling | Uploaded/selected denial letter changes the path and appeal output. |
| Appeal approval | Appeal packet requires human signoff. |
| Care coordination | Approval triggers real mock pharmacy/scheduling task. |
| Audit | Case timeline stores agent outputs, evidence, approvals, API/robot results, and exceptions. |

### Acceptable simplifications

- Synthetic patient data.
- Mock EHR.
- Mock payer API.
- Mock payer portal.
- Mock pharmacy endpoint.
- Pre-seeded but runtime-processed documents.
- Deterministic model prompts to improve demo reliability.

### Not acceptable

- Hard-coded evidence matrix.
- Prewritten appeal displayed without parsing denial/evidence.
- Button that only changes UI status without UiPath workflow.
- Screenshots pretending to be live state.
- No human approval task.
- No audit trail.

### Variability toggles

Build at least three toggles so judges can see the system is not a cached path:

1. **Missing safety lab:** TB/hepatitis screen missing → submission blocked, clinician/staff task created.
2. **Step-therapy denial:** denial reason changes → appeal focuses on tried/failed medication evidence.
3. **Payer API unavailable:** workflow falls back to RPA portal submission.
4. **Clinician rejects assertion:** system removes unsupported claim and asks for more evidence.

---

## 5. User Personas

| Persona | Role in system |
|---|---|
| Prior authorization specialist | Starts cases, reviews missing admin data, monitors submissions. |
| Clinician / specialist | Validates medical assertions and signs appeal language. |
| Nurse coordinator | Provides missing clinical context or lab requirements. |
| Revenue cycle manager | Tracks operational KPIs and denial rates. |
| Patient access coordinator | Coordinates pharmacy/scheduling after approval. |
| Compliance/admin reviewer | Reviews auditability, PHI boundaries, and escalation behavior. |

---

## 6. User Journey

1. PA specialist opens UiPath Apps dashboard.
2. Selects synthetic patient/order: “Biologic medication requires prior auth.”
3. Maestro Case creates Treatment Access Case.
4. API Workflow pulls patient data from mock EHR.
5. IXP/extraction parses payer policy and denial/policy documents.
6. Coverage Requirement Agent generates criteria checklist.
7. Evidence Retrieval Agent maps chart evidence to criteria.
8. Missing Evidence Agent identifies missing TB/hepatitis screen or step-therapy proof.
9. Action Center creates clinician validation task.
10. Clinician approves, edits, or rejects claims.
11. Submission Packet Agent builds authorization packet.
12. API Workflow tries payer API.
13. If API unavailable, UiPath robot submits through mock payer portal.
14. Payer returns denial/request-for-information.
15. Denial Rescue Agent extracts denial reason and deadline.
16. Appeal Packet Agent drafts source-grounded appeal.
17. Clinician approves appeal.
18. System resubmits and receives approval.
19. Care Continuity Agent triggers specialty pharmacy/scheduling task.
20. Dashboard shows full audit trail and metrics.

---

## 7. Functional Requirements

### Intake and case creation

- Start case from UiPath Apps.
- Select patient/order/service/payer.
- Attach or select policy and clinical documents.
- Create unique case ID.
- Store initial state in Data Service.

### Coverage requirement discovery

- Determine whether authorization is required.
- Identify submission channel: API, portal, fax/email fallback.
- Extract criteria from payer policy.
- Normalize criteria into structured checklist.

### Evidence mapping

- Pull chart data from mock EHR.
- Parse documents.
- Map each criterion to evidence.
- Label each criterion as Found / Missing / Conflicting / Needs human validation.
- Provide source references for every evidence claim.

### Human review

- Create Action Center tasks for unsupported or medical claims.
- Allow reviewer to approve, edit, reject, or request more evidence.
- Block submission until required human gates are satisfied.

### Submission

- Generate structured packet.
- Attempt mock payer API submission.
- If API fails, route to robot portal-submission fallback.
- Record submission ID, timestamp, channel, payload summary.

### Denial rescue

- Parse denial letter/API response.
- Extract denial reason, deadline, policy citation, missing evidence.
- Compare denial against submitted evidence.
- Generate appeal checklist and draft.
- Require clinician approval.
- Resubmit appeal.

### Care coordination

- After approval, create task/API update for specialty pharmacy or treatment scheduling.
- Notify patient access coordinator.
- Close case only after downstream handoff is complete.

### Dashboard and reporting

- Case status.
- Evidence matrix.
- SLA countdown.
- Denial/appeal timeline.
- Human tasks pending.
- Robot/API status.
- Audit trail.
- Outcome metrics.

---

## 8. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Reliability | Demo reset script returns system to clean state. |
| Explainability | Every clinical assertion tied to evidence or human approval. |
| Safety | No autonomous medical decision-making. |
| Privacy | Use only synthetic data in hackathon build. |
| Security | Store credentials in Orchestrator assets or environment variables, not code. |
| Observability | Log each agent, human, robot, and API action. |
| Resilience | API failure should route to RPA fallback or human task. |
| Reproducibility | README includes seed data, setup, and run steps. |

---

## 9. UiPath Product Mapping

| UiPath product | Use in this solution |
|---|---|
| Maestro Case | Main case lifecycle and stage orchestration. |
| Agent Builder | Policy, evidence, missing-evidence, submission, denial, appeal, and care-continuity agents. |
| UiPath Apps | Intake dashboard, case dashboard, evidence review UI. |
| Action Center | Clinician approval, appeal signoff, exception handling. |
| IXP | Extract payer policies, denial letters, notes, and forms. |
| Integration Service | Connect to mock EHR, document store, email/Slack/Teams, payer/pharmacy APIs. |
| API Workflows | API-first EHR/payer/pharmacy integration. |
| Studio / Studio Web | Build API workflows and portal-submission robot. |
| Orchestrator | Run jobs, robots, queues, assets, credentials, logs. |
| Data Service | Store cases, evidence, policies, approvals, submissions, outcomes. |
| Test Cloud | Optional but valuable: validate happy path, denial path, portal failure, human rejection. |

---

## 10. System Architecture

### High-level architecture

```text
UiPath Apps
  └── Start / monitor Treatment Access Case
        └── Maestro Case
              ├── API Workflow: Mock EHR data pull
              ├── IXP / extraction: Policy, clinical docs, denial letter
              ├── Agent Builder agents
              │     ├── Coverage Requirement Agent
              │     ├── Evidence Retrieval Agent
              │     ├── Missing Evidence Agent
              │     ├── Submission Packet Agent
              │     ├── Denial Rescue Agent
              │     └── Care Continuity Agent
              ├── Action Center: clinician / PA specialist approvals
              ├── API Workflow: mock payer API submission
              ├── Studio Robot: mock payer portal fallback
              ├── API Workflow: pharmacy/scheduling handoff
              ├── Data Service: state and audit trail
              └── Orchestrator: queues, jobs, logs, credentials
```

### Runtime state

Use Data Service or equivalent persistent storage for:

- Case record.
- Patient/order/coverage snapshot.
- Policy criteria.
- Evidence artifacts.
- Evidence mapping.
- Missing evidence tasks.
- Human approvals.
- Submission packet.
- Payer response.
- Denial/appeal record.
- Care coordination task.
- Audit events.

---

## 11. Data Model

### Core entities

```text
TreatmentAccessCase
- case_id
- patient_id
- order_id
- payer_id
- service_type
- medication_name
- urgency
- status
- current_stage
- created_at
- updated_at
- sla_due_at
- outcome

PatientSnapshot
- patient_id
- age
- synthetic_name
- diagnosis_codes
- coverage_plan
- provider_id

TreatmentOrder
- order_id
- service_type
- medication_name
- dose
- diagnosis
- ordering_provider
- requested_start_date

PayerPolicy
- policy_id
- payer_id
- service_type
- source_document_id
- criteria_json
- version

PolicyCriterion
- criterion_id
- policy_id
- description
- required_evidence_type
- severity
- must_be_clinician_attested

EvidenceArtifact
- artifact_id
- case_id
- type
- source_uri
- extracted_text
- structured_fields
- extraction_confidence

EvidenceMapping
- criterion_id
- artifact_id
- status
- evidence_summary
- confidence
- needs_human_review
- reviewer_decision

HumanTask
- task_id
- case_id
- task_type
- assigned_role
- status
- reviewer_notes
- completed_at

SubmissionPacket
- packet_id
- case_id
- channel
- form_fields
- attachments
- generated_cover_letter
- human_approved

PayerDecision
- decision_id
- case_id
- status
- reason
- denial_code
- appeal_deadline
- raw_response

AppealPacket
- appeal_id
- case_id
- denial_reason
- evidence_used
- draft_text
- clinician_approved
- submitted_at

AuditEvent
- event_id
- case_id
- actor_type
- actor_name
- action
- input_summary
- output_summary
- timestamp
```

---

## 12. Agents

### Coverage Requirement Agent

**Input:** patient coverage, requested treatment, payer policy document.
**Output:** authorization required, criteria checklist, required documents, submission route.

### Evidence Retrieval Agent

**Input:** criteria checklist + chart data + uploaded documents.
**Output:** evidence map with source references and confidence.

### Missing Evidence Agent

**Input:** evidence map.
**Output:** specific tasks for PA specialist or clinician.

### Submission Packet Agent

**Input:** validated evidence map + payer form schema.
**Output:** packet fields, attachment list, cover letter, risk warnings.

### Denial Rescue Agent

**Input:** payer denial response/letter + original submission.
**Output:** denial reason, missing criterion, appeal deadline, appeal strategy.

### Appeal Packet Agent

**Input:** denial analysis + evidence map + clinician notes.
**Output:** appeal draft with source-grounded claims and clinician approval task.

### Care Continuity Agent

**Input:** approval decision + treatment order.
**Output:** pharmacy/scheduling task, patient-access notification, downstream handoff.

### Audit/Compliance Agent

**Input:** full case trail.
**Output:** final audit summary, unsupported claim warnings, incomplete source warnings.

---

## 13. Guardrails

| Risk | Guardrail |
|---|---|
| Hallucinated clinical evidence | Agents may only cite evidence from structured chart data, parsed documents, or human-approved notes. |
| Autonomous medical judgment | Clinical assertions require clinician approval. |
| Prompt injection in uploaded documents | Treat document text as data, not instructions; strip instructions from extracted docs. |
| Low-confidence extraction | Route to Action Center instead of auto-submission. |
| Missing payer criterion | Block submission or require explicit human override. |
| Portal/API failure | Retry, then route to fallback channel or human exception. |
| PHI exposure | Use synthetic data only for hackathon; in production use tenant controls, audit, and least privilege. |
| Fake demo risk | Runtime-generated case, tasks, evidence, submission, and appeal. |

---

## 14. Technical Impressiveness Enhancers

Prioritize these if time allows:

1. **Policy-to-evidence matrix** with source references.
2. **API-first + RPA fallback** submission path.
3. **Live denial parsing** that changes appeal strategy.
4. **Clinician rejection path** showing humans remain accountable.
5. **Case SLA risk score** for likely treatment delay.
6. **Audit timeline** showing agents, robots, humans, and APIs.
7. **Test Cloud suite** for happy path, denial path, API failure, missing evidence.
8. **Codex-built robot/test artifact** for bonus points without making Codex a runtime dependency.

---

## 15. Implementation Plan

### Build slice 1 — Foundations

- Create synthetic patient/order/payer datasets.
- Build mock EHR API or JSON endpoint.
- Build mock payer API.
- Build mock payer portal.
- Build UiPath Apps intake/case dashboard.
- Define Data Service entities.

### Build slice 2 — Case orchestration

- Create Maestro Case stages.
- Connect intake to case creation.
- Add evidence mapping stage.
- Add human approval task.
- Add submission stage.
- Add denial/appeal stage.
- Add care-continuity stage.

### Build slice 3 — Agents and extraction

- Implement policy requirement extraction.
- Implement evidence retrieval and mapping.
- Implement missing-evidence agent.
- Implement packet generation.
- Implement denial rescue.
- Implement appeal draft.

### Build slice 4 — Robots/APIs

- Add mock payer API submission.
- Add UiPath robot for mock payer portal fallback.
- Add mock pharmacy/scheduling update.
- Add retries and exception paths.

### Build slice 5 — Testing and demo polish

- Add reset script.
- Add demo toggles.
- Add audit timeline UI.
- Add Test Cloud/CI tests where feasible.
- Prepare GitHub README, screenshots, video script, deck.

---

## 16. Demo Script: Five Minutes

**0:00–0:30 — Problem**
Prior authorization delays treatment because payer policies, clinical evidence, portals, denials, appeals, and downstream coordination are fragmented.

**0:30–1:00 — Start case**
Open UiPath Apps. Start new case for synthetic patient needing biologic medication.

**1:00–1:45 — Agents assemble evidence**
Show payer policy parsed into criteria. Show evidence matrix: found, missing, needs review.

**1:45–2:20 — Human-in-loop**
Open Action Center clinician task. Clinician approves or supplies missing evidence.

**2:20–3:00 — Submission**
Show API submission attempt. Trigger API failure or use RPA portal fallback. Show Orchestrator job/robot running.

**3:00–3:45 — Denial rescue**
Upload/select denial letter. Agent extracts denial reason and appeal deadline. Appeal draft generated from source-grounded evidence.

**3:45–4:20 — Approval and care continuity**
Clinician approves appeal. Payer approves. Specialty pharmacy/scheduling task is created.

**4:20–5:00 — Architecture and impact**
Show Maestro Case, agents, Action Center, Data Service audit timeline, and explain measurable impact.

---

## 17. Repo / Submission Checklist

- Public GitHub repo.
- MIT or Apache 2.0 license.
- README with setup and run instructions.
- UiPath components list.
- Agent type: low-code agents, coded agents, or both.
- Screenshots of UiPath Apps, Maestro Case, Action Center, Orchestrator job, evidence matrix.
- Demo video under five minutes.
- Presentation deck link.
- Clear statement that data is synthetic.
- Clear statement of what is mocked and what runs live.

---

## 18. Open Questions / Decisions

1. Which disease/medication scenario do you want to use? Recommendation: inflammatory bowel disease + biologic therapy using fictional medication name.
2. Which extraction route is available in your UiPath Labs tenant: IXP, Document Understanding, or a custom extraction API? Use whichever is most reliable.
3. Can you create Action Center tasks in the Labs environment quickly? If not, use UiPath Apps approval screen as fallback, but Action Center is stronger.
4. Can your team build a mock payer portal fast? If not, use mock payer API first and add portal fallback later.
5. Will you include Test Cloud? Optional; valuable, but do not let it block the main Maestro Case demo.
6. Will Codex be used for bonus on this healthcare project? Recommendation: yes, but only for generating test data, robot scaffolding, or tests—not as the runtime core.

---

## 19. Build Priority

If time is tight, build in this order:

1. UiPath Apps intake + Maestro Case state.
2. Evidence matrix from synthetic policy + chart data.
3. Action Center clinician approval.
4. Mock payer API submission.
5. Denial parsing + appeal generation.
6. Pharmacy/scheduling handoff.
7. RPA portal fallback.
8. Test Cloud and Codex bonus artifacts.

The minimum winning-shaped demo is: **case created → evidence mapped → human approval → submitted → denied → appeal generated → approved → downstream task created**.

---

## 20. Source / Reference Notes

Use official hackathon wording in README and deck: this is a working UiPath Automation Cloud solution using UiPath as the orchestration/governance layer. Source URLs to include in project notes:

- https://uipath-agenthack.devpost.com/
- https://uipath-agenthack.devpost.com/rules
- https://uipath-agenthack.devpost.com/resources
- https://docs.uipath.com/maestro/
- https://docs.uipath.com/agents/
- https://docs.uipath.com/action-center/
- https://docs.uipath.com/data-service/
- https://docs.uipath.com/integration-service/
