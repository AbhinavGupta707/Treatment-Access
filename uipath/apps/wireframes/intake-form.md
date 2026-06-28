# Intake Form Wireframe

## Surface

UiPath Apps page name: `Treatment Access Intake`

Fallback surface: Maestro Case App manual start for `Treatment Access Case`

## Layout

Header:

- Title: `Treatment Access Intake`
- Folder label: `TreatmentAccessHackathon`
- Read-only badge: `Synthetic demo data`

Section: Patient And Order

- Synthetic patient selector
- Synthetic order selector
- Treatment selector
- Service line selector
- Urgency segmented control

Section: Payer And Documents

- Payer selector
- Plan selector
- Policy document selector
- Clinical packet selector
- Optional denial letter selector

Section: Demo Scenario

- Preset selector: `Happy path`, `Missing evidence`, `Denial rescue`,
  `Portal fallback`, `Judge demo denial rescue`
- Toggle: missing evidence
- Toggle: clinician review
- Toggle: payer API failure
- Toggle: initial denial
- Toggle: appeal approval
- Timeline depth selector: `minimal`, `judge_demo`, `full_trace`

Section: Case Start Metadata

- Read-only operator role selector defaulted to `pa_specialist`
- Read-only source surface value
- Demo run ID input
- Optional operator note

Footer:

- Primary button: `Start UiPath case`
- Secondary button: `Reset form`

## Submit Behavior

On submit:

1. Validate all required fields.
2. Construct the `intakePayload` object described by
   `schemas/intake-launch.schema.json`.
3. Invoke the Maestro Case manual start or `StartTreatmentAccessCase` API
   Workflow.
4. Show the returned `taccCaseId`.
5. Provide quick links to Maestro, Action Center, and the Command Center.

The page must not render a full duplicate Command Center. It exists only for
case launch and operator handoff.
