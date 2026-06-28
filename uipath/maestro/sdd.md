# SDD - TreatmentAccessCase

Case Definition Blueprint for the Treatment Access Command Center Maestro Case.
This draft is local only and must be approved by the orchestrator before a
skill-generated `tasks.md` or `caseplan.json` is created.

## Table of Contents

1. [Case Definition](#section-1-case-definition)
2. [Stages and Tasks](#section-2-stages-and-tasks)
3. [Personas and App Views](#section-3-personas-and-app-views)
4. [Integrations](#section-4-integrations)
5. [Field Ownership](#section-5-field-ownership)

## Section 1: Case Definition

### Case Metadata

| Property               | Value                                                                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Case Name              | TreatmentAccessCase                                                                                                                                                                                                              |
| Case Description       | Coordinates a synthetic specialty medication access case from intake through payer decision, denial rescue, appeal review, pharmacy handoff, and audit closure. UiPath remains the orchestration and governance source of truth. |
| Case Identifier        | Type: constant. Prefix: TAC                                                                                                                                                                                                      |
| Priority               | Choiceset: Routine, Urgent, Expedited. Default: Urgent                                                                                                                                                                           |
| Case-Level SLA         | 5 d                                                                                                                                                                                                                              |
| SLA Type               | condition-based                                                                                                                                                                                                                  |
| Case App               | Enabled                                                                                                                                                                                                                          |
| Task-output passing    | Direct                                                                                                                                                                                                                           |
| Case Identifier source | `=metadata.ExternalId`                                                                                                                                                                                                           |

### Case-Level SLA Escalation Rules

| SLA Status | Threshold            | Action                                  |
| ---------- | -------------------- | --------------------------------------- |
| At-Risk    | 70% of SLA duration  | Notify: Role:Patient Access Coordinator |
| Breached   | 100% of SLA duration | Notify: Role:Revenue Cycle Manager      |

### Variable SLA Rules

| Expression                                                | SLA | Unit |
| --------------------------------------------------------- | --- | ---- |
| `=js:vars.urgency === "Expedited"`                        | 2   | d    |
| `=js:vars.activeSecondaryStageFlags.includes("sla_risk")` | 1   | d    |

### Case Triggers

| T#  | Trigger Type | Source                  | Configuration                                                  |
| --- | ------------ | ----------------------- | -------------------------------------------------------------- |
| T02 | Manual       | UiPath Apps or Case App | Start treatment access case for a synthetic patient/order pair |

### Case Exit Conditions

| WHEN                        | IF                                                                    | THEN        | Marks Case Complete | Display Name                 |
| --------------------------- | --------------------------------------------------------------------- | ----------- | ------------------- | ---------------------------- |
| `required-stages-completed` | `=js:vars.currentStage === "closure" && vars.caseStatus === "closed"` | Case exited | Yes                 | Treatment access case closed |

### Case Variables

| Name                      | Category | Type     | sourceTriggers | sourceFields | Default                                                           | Description                                                         |
| ------------------------- | -------- | -------- | -------------- | ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| externalCaseKey           | In       | string   |                |              |                                                                   | Synthetic external intake key supplied by UiPath Apps or API caller |
| patientId                 | In       | string   |                |              |                                                                   | Synthetic patient identifier                                        |
| orderId                   | In       | string   |                |              |                                                                   | Synthetic treatment order identifier                                |
| payerId                   | In       | string   |                |              |                                                                   | Synthetic payer identifier                                          |
| syntheticDataDisclaimer   | In       | string   |                |              | "Synthetic demo data only. Not PHI. Not medical or legal advice." | Required disclaimer persisted on every case and audit event         |
| caseId                    | Out      | string   |                |              | `=metadata.ExternalId`                                            | Maestro external case identifier used by downstream lanes           |
| currentStage              | Variable | string   |                |              | "intake"                                                          | Current primary stage enum                                          |
| activeSecondaryStageFlags | Variable | string   |                |              | "[]"                                                              | JSON array of active secondary flags                                |
| caseStatus                | Variable | string   |                |              | "created"                                                         | Overall case status for Command Center snapshots                    |
| patientOrderSnapshotJson  | Variable | string   |                |              | "{}"                                                              | Synthetic EHR/order/coverage snapshot JSON                          |
| payerStatus               | Variable | string   |                |              | "not_submitted"                                                   | Payer status summary                                                |
| evidenceStatusSummary     | Variable | string   |                |              | "pending_intake"                                                  | Evidence matrix summary                                             |
| humanReviewState          | Variable | string   |                |              | "none"                                                            | Human review state summary                                          |
| submissionIds             | Variable | string   |                |              | "[]"                                                              | JSON array of payer submission attempt IDs                          |
| appealStatus              | Variable | string   |                |              | "not_applicable"                                                  | Appeal lifecycle status                                             |
| pharmacyHandoffStatus     | Variable | string   |                |              | "not_started"                                                     | Pharmacy/scheduling handoff status                                  |
| lastEventTimestamp        | Variable | datetime |                |              |                                                                   | Last UiPath-written audit event timestamp                           |
| slaDueAt                  | Variable | datetime |                |              |                                                                   | Current case SLA due timestamp                                      |
| slaState                  | Variable | string   |                |              | "on_track"                                                        | SLA state: on_track, at_risk, breached                              |
| apiFailureCount           | Variable | integer  |                |              | 0                                                                 | Count of payer API failures for fallback rules                      |
| clinicianDecision         | Variable | string   |                |              | "pending"                                                         | Latest clinician validation or appeal decision                      |
| denialReason              | Variable | string   |                |              |                                                                   | Latest denial or RFI reason                                         |
| eventMirrorStatus         | Variable | string   |                |              | "not_written"                                                     | Last event mirror write status                                      |

## Section 2: Stages and Tasks

Primary stage enum values are intentionally snake_case to align with shared
schemas and Command Center filters:

```text
intake
policy_evidence
clinical_validation
submission
payer_decision
denial_rescue
care_continuity
closure
```

### Stage 1: Intake (`stage-intake`)

**Type:** Stage
**Description:** Creates the case shell, records the synthetic-data disclaimer,
hydrates patient/order/coverage data, and writes the first mirror event.
**Required for Case Completion:** Yes

#### Stage Entry Conditions

| WHEN           | IF  | Interrupting | Display Name |
| -------------- | --- | ------------ | ------------ |
| `case-entered` | -   | No           | Case created |

#### Stage Exit Conditions

| WHEN                       | IF                                           | Exit Type | Marks Stage Complete | Display Name    |
| -------------------------- | -------------------------------------------- | --------- | -------------------- | --------------- |
| `required-tasks-completed` | `=js:vars.patientOrderSnapshotJson !== "{}"` | exit-only | Yes                  | Intake hydrated |

#### Tasks

| #   | Task Name                         | Type         | Required | Run Only Once | Persona | SLA |
| --- | --------------------------------- | ------------ | -------- | ------------- | ------- | --- |
| 1   | Register Case State               | api-workflow | Yes      | Yes           | system  | -   |
| 2   | Pull Synthetic EHR Snapshot       | api-workflow | Yes      | Yes           | system  | -   |
| 3   | Write Event Mirror - Case Created | api-workflow | Yes      | No            | system  | -   |

### Stage 2: Policy Evidence (`stage-policy-evidence`)

**Type:** Stage
**Description:** Extracts payer criteria, maps chart evidence, records evidence
status, and activates missing-evidence or exception flags when needed.
**Required for Case Completion:** Yes

#### Stage Entry Conditions

| WHEN                                        | IF                                                                      | Interrupting | Display Name              |
| ------------------------------------------- | ----------------------------------------------------------------------- | ------------ | ------------------------- |
| `selected-stage-completed("Intake")`        | -                                                                       | No           | Intake complete           |
| `selected-stage-exited("Missing Evidence")` | `=js:vars.activeSecondaryStageFlags.indexOf("missing_evidence") === -1` | No           | Missing evidence resolved |
| `selected-stage-exited("Clinician Rework")` | -                                                                       | No           | Rework returned           |

#### Stage Exit Conditions

| WHEN                                                  | IF                                                      | Exit Type | Marks Stage Complete | Display Name               |
| ----------------------------------------------------- | ------------------------------------------------------- | --------- | -------------------- | -------------------------- |
| `required-tasks-completed`                            | `=js:vars.evidenceStatusSummary !== "blocking_missing"` | exit-only | Yes                  | Evidence ready             |
| `selected-tasks-completed("Detect Missing Evidence")` | `=js:vars.evidenceStatusSummary === "blocking_missing"` | exit-only | No                   | Divert to missing evidence |

#### Tasks

| #   | Task Name                            | Type         | Required | Run Only Once | Persona | SLA |
| --- | ------------------------------------ | ------------ | -------- | ------------- | ------- | --- |
| 1   | Coverage Requirement Agent           | agent        | Yes      | No            | system  | -   |
| 2   | Evidence Retrieval Agent             | agent        | Yes      | No            | system  | -   |
| 3   | Detect Missing Evidence              | agent        | Yes      | No            | system  | -   |
| 4   | Write Event Mirror - Evidence Mapped | api-workflow | Yes      | No            | system  | -   |

### Stage 3: Clinical Validation (`stage-clinical-validation`)

**Type:** Stage
**Description:** Routes source-backed clinical assertions to a clinician for
approval, edit, rejection, or request for more evidence.
**Required for Case Completion:** Yes

#### Stage Entry Conditions

| WHEN                                          | IF                                             | Interrupting | Display Name                    |
| --------------------------------------------- | ---------------------------------------------- | ------------ | ------------------------------- |
| `selected-stage-completed("Policy Evidence")` | `=js:vars.humanReviewState !== "not_required"` | No           | Evidence needs clinician review |

#### Stage Exit Conditions

| WHEN                                                        | IF                                                                                                  | Exit Type | Marks Stage Complete | Display Name                 |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------- | -------------------- | ---------------------------- |
| `required-tasks-completed`                                  | `=js:vars.clinicianDecision === "approved" \|\| vars.clinicianDecision === "edited"`                | exit-only | Yes                  | Clinical validation complete |
| `selected-tasks-completed("Clinician Evidence Validation")` | `=js:vars.clinicianDecision === "rejected" \|\| vars.clinicianDecision === "request_more_evidence"` | exit-only | No                   | Divert to clinician rework   |

#### Tasks

| #   | Task Name                                      | Type         | Required | Run Only Once | Persona   | SLA |
| --- | ---------------------------------------------- | ------------ | -------- | ------------- | --------- | --- |
| 1   | Create Clinician Evidence Task                 | action       | Yes      | No            | Clinician | 1 d |
| 2   | Persist Clinical Review Decision               | api-workflow | Yes      | No            | system    | -   |
| 3   | Write Event Mirror - Clinical Review Completed | api-workflow | Yes      | No            | system    | -   |

### Stage 4: Submission (`stage-submission`)

**Type:** Stage
**Description:** Builds the payer submission packet, attempts payer API
submission, and falls back to the mock portal robot when the API is unavailable.
**Required for Case Completion:** Yes

#### Stage Entry Conditions

| WHEN                                              | IF                                           | Interrupting | Display Name            |
| ------------------------------------------------- | -------------------------------------------- | ------------ | ----------------------- |
| `selected-stage-completed("Clinical Validation")` | `=js:vars.evidenceStatusSummary === "ready"` | No           | Submit after validation |

#### Stage Exit Conditions

| WHEN                                           | IF                                           | Exit Type | Marks Stage Complete | Display Name              |
| ---------------------------------------------- | -------------------------------------------- | --------- | -------------------- | ------------------------- |
| `required-tasks-completed`                     | `=js:vars.payerStatus === "submitted"`       | exit-only | Yes                  | Submission complete       |
| `selected-tasks-completed("Submit Payer API")` | `=js:vars.payerStatus === "api_unavailable"` | exit-only | No                   | Divert to portal fallback |

#### Tasks

| #   | Task Name                                 | Type         | Required | Run Only Once | Persona | SLA |
| --- | ----------------------------------------- | ------------ | -------- | ------------- | ------- | --- |
| 1   | Submission Packet Agent                   | agent        | Yes      | No            | system  | -   |
| 2   | Submit Payer API                          | api-workflow | Yes      | No            | system  | -   |
| 3   | Write Event Mirror - Submission Attempted | api-workflow | Yes      | No            | system  | -   |

### Stage 5: Payer Decision (`stage-payer-decision`)

**Type:** Stage
**Description:** Waits for and parses the payer decision, activating denial
rescue for denied or request-for-information outcomes.
**Required for Case Completion:** Yes

#### Stage Entry Conditions

| WHEN                                     | IF  | Interrupting | Display Name        |
| ---------------------------------------- | --- | ------------ | ------------------- |
| `selected-stage-completed("Submission")` | -   | No           | Submission finished |

#### Stage Exit Conditions

| WHEN                                               | IF                                                                  | Exit Type | Marks Stage Complete | Display Name            |
| -------------------------------------------------- | ------------------------------------------------------------------- | --------- | -------------------- | ----------------------- |
| `required-tasks-completed`                         | `=js:vars.payerStatus === "approved"`                               | exit-only | Yes                  | Payer approved          |
| `selected-tasks-completed("Fetch Payer Decision")` | `=js:vars.payerStatus === "denied" \|\| vars.payerStatus === "rfi"` | exit-only | No                   | Divert to denial rescue |

#### Tasks

| #   | Task Name                                    | Type           | Required | Run Only Once | Persona | SLA |
| --- | -------------------------------------------- | -------------- | -------- | ------------- | ------- | --- |
| 1   | Wait For Payer Decision                      | wait-for-timer | Yes      | No            | system  | -   |
| 2   | Fetch Payer Decision                         | api-workflow   | Yes      | No            | system  | -   |
| 3   | Write Event Mirror - Payer Decision Received | api-workflow   | Yes      | No            | system  | -   |

### Stage 6: Denial Rescue (`stage-denial-rescue`)

**Type:** Stage
**Description:** Parses a denial or RFI, drafts an administrative appeal from
source-backed evidence, and requires clinician signoff before resubmission.
**Required for Case Completion:** Yes

#### Stage Entry Conditions

| WHEN                                      | IF                                                                  | Interrupting | Display Name           |
| ----------------------------------------- | ------------------------------------------------------------------- | ------------ | ---------------------- |
| `selected-stage-exited("Payer Decision")` | `=js:vars.payerStatus === "denied" \|\| vars.payerStatus === "rfi"` | No           | Denial or RFI received |

#### Stage Exit Conditions

| WHEN                       | IF                                                   | Exit Type | Marks Stage Complete | Display Name     |
| -------------------------- | ---------------------------------------------------- | --------- | -------------------- | ---------------- |
| `required-tasks-completed` | `=js:vars.appealStatus === "approved_and_submitted"` | exit-only | Yes                  | Appeal submitted |

#### Tasks

| #   | Task Name                             | Type         | Required | Run Only Once | Persona   | SLA |
| --- | ------------------------------------- | ------------ | -------- | ------------- | --------- | --- |
| 1   | Denial Rescue Agent                   | agent        | Yes      | No            | system    | -   |
| 2   | Appeal Packet Agent                   | agent        | Yes      | No            | system    | -   |
| 3   | Clinician Appeal Signoff              | action       | Yes      | No            | Clinician | 1 d |
| 4   | Submit Appeal API                     | api-workflow | Yes      | No            | system    | -   |
| 5   | Write Event Mirror - Appeal Submitted | api-workflow | Yes      | No            | system    | -   |

### Stage 7: Care Continuity (`stage-care-continuity`)

**Type:** Stage
**Description:** Creates the downstream specialty pharmacy or scheduling
handoff after payer approval or approved appeal.
**Required for Case Completion:** Yes

#### Stage Entry Conditions

| WHEN                                         | IF                                                   | Interrupting | Display Name                  |
| -------------------------------------------- | ---------------------------------------------------- | ------------ | ----------------------------- |
| `selected-stage-completed("Payer Decision")` | `=js:vars.payerStatus === "approved"`                | No           | Approval received             |
| `selected-stage-completed("Denial Rescue")`  | `=js:vars.appealStatus === "approved_and_submitted"` | No           | Appeal approved and submitted |

#### Stage Exit Conditions

| WHEN                       | IF                                               | Exit Type | Marks Stage Complete | Display Name          |
| -------------------------- | ------------------------------------------------ | --------- | -------------------- | --------------------- |
| `required-tasks-completed` | `=js:vars.pharmacyHandoffStatus === "completed"` | exit-only | Yes                  | Care handoff complete |

#### Tasks

| #   | Task Name                                       | Type         | Required | Run Only Once | Persona | SLA |
| --- | ----------------------------------------------- | ------------ | -------- | ------------- | ------- | --- |
| 1   | Care Continuity Agent                           | agent        | Yes      | No            | system  | -   |
| 2   | Send Pharmacy Handoff                           | api-workflow | Yes      | No            | system  | -   |
| 3   | Write Event Mirror - Pharmacy Handoff Completed | api-workflow | Yes      | No            | system  | -   |

### Stage 8: Closure (`stage-closure`)

**Type:** Stage
**Description:** Produces the final audit summary, records closure state, and
marks the synthetic treatment access case closed.
**Required for Case Completion:** Yes

#### Stage Entry Conditions

| WHEN                                          | IF  | Interrupting | Display Name     |
| --------------------------------------------- | --- | ------------ | ---------------- |
| `selected-stage-completed("Care Continuity")` | -   | No           | Handoff complete |

#### Stage Exit Conditions

| WHEN                       | IF                                 | Exit Type | Marks Stage Complete | Display Name |
| -------------------------- | ---------------------------------- | --------- | -------------------- | ------------ |
| `required-tasks-completed` | `=js:vars.caseStatus === "closed"` | exit-only | Yes                  | Audit closed |

#### Tasks

| #   | Task Name                        | Type         | Required | Run Only Once | Persona | SLA |
| --- | -------------------------------- | ------------ | -------- | ------------- | ------- | --- |
| 1   | Generate Audit Packet            | api-workflow | Yes      | Yes           | system  | -   |
| 2   | Write Event Mirror - Case Closed | api-workflow | Yes      | No            | system  | -   |

### Secondary Stage Flags

Secondary stages are represented in case state as `activeSecondaryStageFlags`.
Each flag is written to Data Service and mirrored as an audit event.

| Flag                        | Trigger                                                                                                | Required transition rule                                                                   | Clears when                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| missing_evidence            | Evidence matrix has a blocking missing criterion                                                       | Policy Evidence exits without completion and routes to Missing Evidence                    | Human or workflow supplies evidence and evidence matrix recomputes          |
| api_failure_portal_fallback | Payer API returns unavailable, timeout, or configured demo failure                                     | Submission exits without completion and starts portal fallback RPA                         | Portal robot returns confirmation or human exception review takes ownership |
| denial_rescue_appeal        | Payer decision is denied or RFI                                                                        | Payer Decision exits without completion and routes to Denial Rescue                        | Appeal packet is clinician-approved and submitted                           |
| clinician_rework            | Clinician rejects or requests more evidence                                                            | Clinical Validation exits without completion and routes to Clinician Rework                | Rework updates evidence summary and returns to Policy Evidence              |
| sla_risk                    | Case or stage reaches at-risk SLA threshold                                                            | SLA At Risk exception creates coordinator notification but does not complete primary stage | SLA state returns to on_track or case closes                                |
| human_exception_review      | Low-confidence extraction, contradictory evidence, repeated failure, or unsupported clinical assertion | Human Exception Review pauses the affected stage until resolved                            | Reviewer records decision and target stage resumes                          |

### Exception Stage Transition Rules

| Exception Stage             | Entry                                                                           | Exit                                                           |
| --------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Missing Evidence            | `selected-stage-exited("Policy Evidence")` with `missing_evidence` active       | `return-to-origin` after missing evidence task completed       |
| API Failure Portal Fallback | `selected-stage-exited("Submission")` with `api_failure_portal_fallback` active | `return-to-origin` after RPA confirmation writes submission ID |
| Clinician Rework            | `selected-stage-exited("Clinical Validation")` with `clinician_rework` active   | `return-to-origin` after rework event updates evidence         |
| SLA At Risk                 | SLA threshold fires with `sla_risk` active                                      | `return-to-origin` after notification/event write              |
| Human Exception Review      | User-selected or system-selected exception with `human_exception_review` active | `return-to-origin` after reviewer resolution                   |

## Section 3: Personas and App Views

### Personas

| Persona                        | Stage Scope                                          | Permissions         | Description                                                         |
| ------------------------------ | ---------------------------------------------------- | ------------------- | ------------------------------------------------------------------- |
| Prior Authorization Specialist | Intake, Missing Evidence, Human Exception Review     | View, Act, Reassign | Starts and monitors synthetic treatment access cases                |
| Clinician                      | Clinical Validation, Denial Rescue, Clinician Rework | View, Act           | Approves, edits, or rejects clinical assertions and appeal language |
| Nurse Coordinator              | Missing Evidence, Clinician Rework                   | View, Act           | Supplies missing safety screening or clinical context               |
| Patient Access Coordinator     | Care Continuity, SLA At Risk                         | View, Act           | Coordinates pharmacy and scheduling handoff                         |
| Revenue Cycle Manager          | All                                                  | View, Reassign      | Monitors SLA risk, denial rescue, and operational outcomes          |

### Process App Views

| App                       | View            | Persona                        | Purpose                                  | Key Components                                                       |
| ------------------------- | --------------- | ------------------------------ | ---------------------------------------- | -------------------------------------------------------------------- |
| Treatment Access Case App | Case List       | Prior Authorization Specialist | Select and monitor synthetic cases       | Case ID, current stage, SLA state, payer status, active flags        |
| Treatment Access Case App | Case Detail     | All                            | Inspect live case state and task history | Stage rail, evidence summary, human tasks, submissions, audit events |
| Treatment Access Case App | Evidence Review | Clinician                      | Review clinical assertions               | Criteria, evidence quote, citation, decision buttons, reviewer edits |

## Section 4: Integrations

### API Workflows

| Workflow         | Folder                   | Resource ID (+version)    | Inputs -> Outputs                               | Used By Tasks                                             |
| ---------------- | ------------------------ | ------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| TaccCaseStateApi | TreatmentAccessHackathon | Pending API Workflow lane | caseId, eventType, payload -> status, recordId  | Register Case State, all event mirror write tasks         |
| TaccMockEhrApi   | TreatmentAccessHackathon | Pending API Workflow lane | patientId, orderId -> patientOrderSnapshotJson  | Pull Synthetic EHR Snapshot                               |
| TaccPayerApi     | TreatmentAccessHackathon | Pending API Workflow lane | caseId, packetJson -> submissionId, payerStatus | Submit Payer API, Fetch Payer Decision, Submit Appeal API |
| TaccPharmacyApi  | TreatmentAccessHackathon | Pending API Workflow lane | caseId, approvalJson -> handoffId, status       | Send Pharmacy Handoff                                     |

### Agents

| Agent                      | Folder                   | Resource ID (+version) | Inputs -> Outputs                        | Used By Tasks              |
| -------------------------- | ------------------------ | ---------------------- | ---------------------------------------- | -------------------------- |
| Coverage Requirement Agent | TreatmentAccessHackathon | Pending agents lane    | policy/order snapshot -> criteria        | Coverage Requirement Agent |
| Evidence Retrieval Agent   | TreatmentAccessHackathon | Pending agents lane    | criteria/chart docs -> evidence matrix   | Evidence Retrieval Agent   |
| Missing Evidence Agent     | TreatmentAccessHackathon | Pending agents lane    | evidence matrix -> gaps and assignment   | Detect Missing Evidence    |
| Submission Packet Agent    | TreatmentAccessHackathon | Pending agents lane    | validated evidence -> packet             | Submission Packet Agent    |
| Denial Rescue Agent        | TreatmentAccessHackathon | Pending agents lane    | denial/submission -> denial analysis     | Denial Rescue Agent        |
| Appeal Packet Agent        | TreatmentAccessHackathon | Pending agents lane    | denial/evidence -> appeal draft          | Appeal Packet Agent        |
| Care Continuity Agent      | TreatmentAccessHackathon | Pending agents lane    | approval/order -> handoff recommendation | Care Continuity Agent      |

### Processes and RPA

| Resource                   | Type | Folder                   | Resource ID (+version) | Used By Tasks               |
| -------------------------- | ---- | ------------------------ | ---------------------- | --------------------------- |
| Mock Payer Portal Fallback | rpa  | TreatmentAccessHackathon | Pending RPA lane       | API Failure Portal Fallback |

### Integration Service Connectors

> None required for Checkpoint 2 local contract. API Workflow lanes own HTTP
> calls to mock EHR, payer, pharmacy, and event mirror services.

### Child Cases

> None.

## Section 5: Field Ownership

| Field                       | Owner                                       | Write trigger                                 |
| --------------------------- | ------------------------------------------- | --------------------------------------------- |
| caseId                      | Maestro Case                                | Case creation from `metadata.ExternalId`      |
| externalCaseKey             | Intake/App lane                             | Case start argument                           |
| patientId, orderId, payerId | Intake/App lane                             | Case start argument                           |
| patientOrderSnapshotJson    | API Workflow lane                           | Mock EHR pull completes                       |
| currentStage                | Maestro Case                                | Stage entry and exit transitions              |
| activeSecondaryStageFlags   | Maestro Case plus exception tasks           | Secondary flag activation and clearing        |
| payerStatus                 | API Workflow lane                           | Payer submit/status/appeal responses          |
| evidenceStatusSummary       | Agent lane                                  | Evidence mapping and missing evidence outputs |
| humanReviewState            | Action Center lane                          | Task creation and completion                  |
| submissionIds               | API Workflow/RPA lanes                      | Payer API submission or portal confirmation   |
| appealStatus                | Denial/appeal agents and Action Center lane | Appeal draft, signoff, and resubmission       |
| pharmacyHandoffStatus       | API Workflow/Care Continuity lane           | Pharmacy handoff response                     |
| lastEventTimestamp          | Event mirror API Workflow                   | Every audit event write                       |
| slaDueAt, slaState          | Maestro Case                                | SLA rule evaluation                           |
| syntheticDataDisclaimer     | Intake/App lane                             | Case start argument and every event payload   |
