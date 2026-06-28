# Fixture Contracts

Checkpoint 1 fixture data lives in `packages/demo-data` and validates against
`packages/shared-schemas`. All fixture content is synthetic and uses
`fixture://` source URIs instead of real patient, provider, payer, or document
locations.

## Primary Exports

- `treatmentAccessDemoFixture` is the aggregate contract for API/UI reset state.
- `seedCase`, `seedPatient`, `seedOrder`, `seedPayerPolicy`, `seedCriteria`,
  and `seedEvidenceMappings` preserve the Checkpoint 0 export names.
- `seedArtifacts`, `seedAttachments`, `seedLabs`, and
  `seedMedicationHistory` provide mock EHR/document payloads.
- `missingEvidenceMappings` and `missingSafetyLabScenario` model the blocking
  missing-evidence path for safety screening.
- `seedSubmissionPacket`, `seedSubmissionAttempts`, `seedPayerDecisions`,
  `denialLetterScenarios`, and `seedAppealPacket` model submission, denial,
  and appeal rescue.
- `seedPharmacyHandoff` and `pharmacyHandoffDetails` model post-approval care
  continuity.
- `seedHumanTasks`, `seedAgentTraces`, and `seedAuditEvents` provide the
  Action Center, agent trace, and event mirror backbone.
- `defaultDemoToggles` defines the reset state for demo mode toggles.

## Safety Rules

- Do not replace synthetic labels with real patient, payer, provider, member,
  credential, or contact data.
- Do not paste real clinical notes, payer policy text, denial letters, or
  appeal language into fixtures.
- Appeal text is an administrative draft for clinician review and remains
  blocked until a clinician approval event is recorded.
