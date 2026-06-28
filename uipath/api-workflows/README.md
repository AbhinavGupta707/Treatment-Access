# Treatment Access API Workflows

This folder contains local UiPath API Workflow JSON artifacts for Checkpoint 2.
They call the synthetic mock healthcare/event API built in Checkpoint 1 and are
intended to be invoked by Maestro case tasks or later agents. The custom Command
Center should continue to read state written by UiPath-owned workflow, agent,
robot, or human actions.

All payloads are synthetic. Do not send real patient, payer, provider,
credential, or PHI data to these workflows.

## Workflows

| Workflow | Purpose | Key inputs | Structured response |
| --- | --- | --- | --- |
| `ehr-order-evidence-pull.workflow.json` | Pulls case snapshot, evidence matrix, patient, order, medication history, and EHR document list from the mock API. | `apiBaseUrl`, `caseId`, `patientId`, `orderId` | `caseSnapshot`, `evidenceMatrix`, `patient`, `order`, `medicationHistory`, `documents`, `httpStatus` |
| `write-event.workflow.json` | Writes a case-linked audit/event mirror record with actor `api_workflow`. | `apiBaseUrl`, `caseId`, `action`, `inputSummary`, `outputSummary`, optional trace/job/evidence fields | `eventWrite`, `event`, `eventCount`, `httpStatus` |
| `payer-prior-auth-submit.workflow.json` | Submits synthetic prior authorization to `POST /payer/prior-auth`. | `apiBaseUrl`, `caseId`, `patientId`, `orderId`, `evidenceRefs` | `submission`, `submissionId`, `fallbackRequired`, `httpStatus` |
| `payer-status-fetch.workflow.json` | Fetches payer status/decision from `GET /payer/prior-auth/{submissionId}/status`. | `apiBaseUrl`, `caseId`, `submissionId` | `payerStatus`, `decisionStatus`, `denialCode`, `reason`, `fallbackRequired`, `httpStatus` |
| `pharmacy-scheduling-handoff.workflow.json` | Creates a pharmacy handoff and then a scheduling task linked to the returned `handoff_id`. | `apiBaseUrl`, `caseId`, `patientId`, `orderId`, `approvalReference` | `pharmacyHandoff`, `schedulingTask`, `handoffId`, `schedulingTaskId`, `httpStatus` |

## Maestro Call Pattern

Maestro should bind the case fields into each workflow input:

- `apiBaseUrl` from an Orchestrator asset such as `TACC_MOCK_API_BASE_URL` or an environment-specific argument.
- `caseId`, `patientId`, and `orderId` from the Maestro case/Data Service state.
- `submissionId` from the payer submit response.
- `approvalReference` from a payer or appeal approval response.

Recommended sequence:

1. Intake & Hydration calls `ehr-order-evidence-pull.workflow.json`.
2. Material Maestro or agent steps call `write-event.workflow.json` after state changes.
3. Submission calls `payer-prior-auth-submit.workflow.json`.
4. Payer Decision calls `payer-status-fetch.workflow.json` with the returned `submissionId`.
5. Approval & Care Continuity calls `pharmacy-scheduling-handoff.workflow.json`.

## Samples

Sample inputs live in `samples/`. They intentionally use local development
URLs such as `http://127.0.0.1:8787`. Workflow files themselves do not hardcode
localhost.

Static validation command for every workflow:

```bash
uip api-workflow validate uipath/api-workflows/<workflow>.workflow.json --output json
```

Approved local no-auth smoke commands, after the mock API is running and after
explicit user/orchestrator approval:

```bash
uip api-workflow run uipath/api-workflows/ehr-order-evidence-pull.workflow.json --no-auth --input-arguments "$(cat uipath/api-workflows/samples/ehr-order-evidence-pull.sample.json)" --output json
uip api-workflow run uipath/api-workflows/write-event.workflow.json --no-auth --input-arguments "$(cat uipath/api-workflows/samples/write-event.sample.json)" --output json
uip api-workflow run uipath/api-workflows/payer-prior-auth-submit.workflow.json --no-auth --input-arguments "$(cat uipath/api-workflows/samples/payer-prior-auth-submit.sample.json)" --output json
uip api-workflow run uipath/api-workflows/payer-status-fetch.workflow.json --no-auth --input-arguments "$(cat uipath/api-workflows/samples/payer-status-fetch.sample.json)" --output json
uip api-workflow run uipath/api-workflows/pharmacy-scheduling-handoff.workflow.json --no-auth --input-arguments "$(cat uipath/api-workflows/samples/pharmacy-scheduling-handoff.sample.json)" --output json
```

Do not run these smoke commands without approval. The submit, event, pharmacy,
and scheduling workflows write synthetic state into the mock API.
