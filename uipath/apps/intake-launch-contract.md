# Treatment Access Intake Launch Contract

## Chosen Path

Use a UiPath low-code Apps intake page backed by the same contract as the
Maestro Case App manual start form.

Preferred demo launch:

1. Operator opens UiPath Apps and selects `Treatment Access Intake`.
2. Operator selects a synthetic patient, order, payer, treatment, urgency, and
   scenario toggles.
3. Submit invokes the Maestro `Treatment Access Case` manual start path.
4. The first case task invokes the API Workflow `StartTreatmentAccessCase`.
5. `StartTreatmentAccessCase` hydrates the seeded synthetic case from the mock
   API, records the UiPath-origin start event, and returns the case identifiers
   that Maestro and the Command Center use next. Live Data Service upsert
   remains governed by the Maestro/Data Service hard stop.

Fallback if the low-code Apps page is not published in time:

1. Operator opens the Maestro Case App or Studio Web case start surface for
   `Treatment Access Case`.
2. Operator fills the same fields from
   `schemas/intake-launch.schema.json`.
3. The manual start arguments carry the payload to the same first case task,
   `StartTreatmentAccessCase`.

This checkpoint does not create a Coded Web App scaffold. Coded Apps remain a
valid later option, but Checkpoint 2 needs a visible UiPath launch moment more
than another custom frontend.

## Intake Fields

All values are synthetic. Do not enter real patient, payer, provider,
credential, or personal health data.

Required selection fields:

| Field                        | Type   | Purpose                                                          |
| ---------------------------- | ------ | ---------------------------------------------------------------- |
| `patient.syntheticPatientId` | string | Synthetic patient fixture key.                                   |
| `order.syntheticOrderId`     | string | Synthetic treatment order fixture key.                           |
| `payer.payerId`              | string | Mock payer fixture key.                                          |
| `treatment.treatmentId`      | string | Requested treatment fixture key.                                 |
| `urgency`                    | enum   | `routine`, `urgent`, or `expedited`.                             |
| `caseStart.requestedByRole`  | enum   | Demo operator role starting the case.                            |
| `caseStart.sourceSurface`    | enum   | `uipath_apps`, `maestro_case_app`, or `studio_web_manual_start`. |
| `caseStart.demoRunId`        | string | Unique demo run correlation ID.                                  |

Optional selection fields:

| Field                        | Type   | Purpose                                               |
| ---------------------------- | ------ | ----------------------------------------------------- |
| `patient.displayLabel`       | string | Synthetic display label for the operator.             |
| `order.diagnosisCode`        | string | Synthetic diagnosis code or fixture alias.            |
| `payer.planId`               | string | Synthetic plan fixture key.                           |
| `treatment.serviceLine`      | enum   | Clinical service line for routing.                    |
| `documents.policyDocumentId` | string | Synthetic payer policy document fixture.              |
| `documents.clinicalPacketId` | string | Synthetic chart packet fixture.                       |
| `documents.denialLetterId`   | string | Optional denial/RFI document fixture for rescue path. |

Scenario toggles:

| Field                           | Type    | Purpose                                                 |
| ------------------------------- | ------- | ------------------------------------------------------- |
| `scenario.forceMissingEvidence` | boolean | Makes evidence assembly create a missing-evidence path. |
| `scenario.forceClinicianReview` | boolean | Ensures Action Center validation is created.            |
| `scenario.forcePayerApiFailure` | boolean | Routes submission to the portal robot fallback.         |
| `scenario.forceInitialDenial`   | boolean | Produces denial rescue/appeal path.                     |
| `scenario.forceAppealApproval`  | boolean | Lets appeal path end in approval for demo closure.      |
| `scenario.seedTimeline`         | enum    | `minimal`, `judge_demo`, or `full_trace`.               |

Case start metadata:

| Field                            | Type   | Purpose                                           |
| -------------------------------- | ------ | ------------------------------------------------- |
| `caseStart.requestedAtUtc`       | string | ISO-8601 submit timestamp.                        |
| `caseStart.uipathFolderKey`      | string | Folder key for `TreatmentAccessHackathon`.        |
| `caseStart.commandCenterBaseUrl` | string | Optional Command Center URL for operator handoff. |
| `caseStart.operatorNotes`        | string | Synthetic demo note only.                         |

See `schemas/intake-launch.schema.json` for exact validation.

## Launch Invocation

### UiPath Apps Submit Button

Configure the submit action to call the published Maestro manual start or API
Workflow entry point with one JSON argument:

```json
{
  "intakePayload": "<serialized object matching schemas/intake-launch.schema.json>"
}
```

If UiPath Apps can bind directly to the Maestro case start action, map each form
control to the same `intakePayload` object. If Apps only calls an API Workflow in
the current tenant, call `StartTreatmentAccessCase` directly and let that
workflow start the case instance before writing the first mirror event.

### Maestro Manual Start Arguments

The Maestro/Data Service lane should expose these manual start arguments:

| Argument            | Direction | Type   | Notes                                                |
| ------------------- | --------- | ------ | ---------------------------------------------------- |
| `intakePayloadJson` | In        | String | Serialized intake payload.                           |
| `launchSurface`     | In        | String | Same value as `caseStart.sourceSurface`.             |
| `demoRunId`         | In        | String | Correlation key for Data Service and Command Center. |

The first stage must be `Intake & Hydration`. The first task in that stage
should be `StartTreatmentAccessCase`, an API Workflow task.

### API Workflow Start Contract

`StartTreatmentAccessCase` receives:

```json
{
  "apiBaseUrl": "http://127.0.0.1:8787",
  "caseId": "case-syn-001",
  "taccCaseId": "TACC-20260629-001",
  "patientId": "patient-syn-001",
  "orderId": "order-syn-001",
  "maestroCaseInstanceId": "<runtime case id from Maestro>",
  "demoRunId": "demo-2026-06-29-ckpt2",
  "launchSurface": "uipath_apps",
  "intakePayload": {}
}
```

It must:

1. Validate required fixture IDs, scenario toggles, and mock API seed IDs.
2. Generate or accept a human-readable `taccCaseId`, for example
   `TACC-20260629-001`.
3. Read the seeded mock API case snapshot for `caseId`.
4. Write the first mock event mirror record with `action=case_created`.
5. Return `{ "caseId": "...", "taccCaseId": "...", "demoRunId": "...", "nextStage": "policy_evidence" }`.

The Checkpoint 2 local artifact for this contract is
`../api-workflows/start-treatment-access-case.workflow.json`.

## First Event Mirror Record

The first event must be written by UiPath, not by the local Command Center.

Event type: `case.created`

Recommended `WriteEventMirror` input:

```json
{
  "eventId": "evt_TACC-20260629-001_case_created_001",
  "eventType": "case.created",
  "taccCaseId": "TACC-20260629-001",
  "maestroCaseInstanceId": "<runtime case id>",
  "demoRunId": "demo-2026-06-29-ckpt2",
  "stage": "Intake & Hydration",
  "status": "intake_started",
  "source": {
    "surface": "uipath_apps",
    "producer": "StartTreatmentAccessCase",
    "uipathFolderKey": "4fba2fa1-012b-469a-b6aa-e5be3811c173"
  },
  "summary": "Synthetic intake submitted from UiPath and Treatment Access case created.",
  "payload": {
    "syntheticPatientId": "syn-patient-ibd-001",
    "syntheticOrderId": "syn-order-biologic-001",
    "mockApiCaseId": "case-syn-001",
    "mockApiPatientId": "patient-syn-001",
    "mockApiOrderId": "order-syn-001",
    "payerId": "payer-northstar",
    "treatmentId": "tx-biologic-alpha",
    "urgency": "urgent",
    "scenario": {
      "forceMissingEvidence": true,
      "forceClinicianReview": true,
      "forcePayerApiFailure": true,
      "forceInitialDenial": true,
      "forceAppealApproval": true,
      "seedTimeline": "judge_demo"
    }
  }
}
```

See `schemas/event-mirror-record.schema.json` and
`samples/first-event-mirror.case-created.json`.

## Integration Notes

For the Maestro/Data Service lane:

- Add the manual start arguments above to the case definition.
- Make `StartTreatmentAccessCase` the first task in `Intake & Hydration`.
- Persist these minimum case fields: `taccCaseId`, `demoRunId`,
  `maestroCaseInstanceId`, `syntheticPatientId`, `syntheticOrderId`, `payerId`,
  `treatmentId`, `urgency`, `currentStage`, `status`, `scenario`, and
  `createdAtUtc`.
- Treat the case instance as the source of truth for stage progression.

For the API Workflow lane:

- Use `start-treatment-access-case.workflow.json` for the first task and
  `write-event.workflow.json` for later event writes.
- In the local Checkpoint 2 path, `StartTreatmentAccessCase` writes to the mock
  event mirror API. After live Data Service approval, map the same payload to
  the Data Service event entity.
- Return the `eventId` and mirror write status so Maestro can log the first
  audit step.

For the Action Center lane:

- Use `forceClinicianReview` and later evidence outputs to create clinician
  validation tasks.
- Keep appeal language labelled as administrative draft text for clinician
  review.

For the Command Center lane:

- Read `case.created` and later UiPath-written events from the event mirror.
- Do not create the case locally when launched from this path.
