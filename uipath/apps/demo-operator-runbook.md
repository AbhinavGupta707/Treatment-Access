# Demo Operator Runbook

## Before The Demo

1. Confirm the active UiPath tenant is `galacticus / DefaultTenant`.
2. Confirm the folder is `TreatmentAccessHackathon`.
3. Confirm the folder key is `4fba2fa1-012b-469a-b6aa-e5be3811c173`.
4. Open the Command Center in a separate browser tab for visualization only.
5. Keep Maestro and Action Center tabs available for the live UiPath proof
   points.

## Start The Case

Primary launch:

1. Open UiPath Apps.
2. Open `Treatment Access Intake`.
3. Choose the `Judge demo denial rescue` preset.
4. Confirm these synthetic selections:
   - Patient: `syn-patient-ibd-001`
   - Order: `syn-order-biologic-001`
   - Payer: `payer-northstar`
   - Treatment: `tx-biologic-alpha`
   - Urgency: `urgent`
5. Leave these toggles on:
   - Missing evidence
   - Clinician review
   - Payer API failure
   - Initial denial
   - Appeal approval
6. Submit the intake.

Fallback launch:

1. Open the Maestro Case App or Studio Web manual start surface for
   `Treatment Access Case`.
2. Paste or enter the same values from
   `samples/intake-launch.denial-rescue.json`.
3. Start the case.

## Switch Surfaces

After submit:

1. Switch to Maestro and show the new case instance in `Intake & Hydration`.
2. Show the first API Workflow task, `StartTreatmentAccessCase`, as the origin
   of the initial case state and event mirror write.
3. Switch to Action Center when the clinician validation task appears.
4. Complete the clinician task using synthetic approval language only.
5. Switch to the Command Center and show the same `case.created` event and
   stage progression.
6. Continue the main demo through payer API failure, portal fallback, denial
   rescue, appeal approval, and pharmacy handoff.

## What To Say

The opening sentence should make the architecture clear:

> We start in UiPath, not in the custom dashboard. This intake creates the
> Maestro case, runs the first API Workflow, and writes the first event that the
> Command Center displays.

## Safety Notes

- Use synthetic fixture IDs only.
- Do not enter real patient, payer, provider, credential, or personal health
  data.
- Do not describe appeal output as medical or legal advice; it is an
  administrative draft routed for clinician review.
- Do not publish, deploy, or debug-run live UiPath artifacts unless the
  orchestrator session has explicit approval.
