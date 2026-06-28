import { describe, expect, it } from "vitest";
import {
  AgentTraceSchema,
  AppealPacketSchema,
  AttachmentMetadataSchema,
  AuditEventSchema,
  DemoFixtureSchema,
  EvidenceArtifactSchema,
  EvidenceMappingSchema,
  LabResultSchema,
  MedicationHistoryEntrySchema,
  PatientSnapshotSchema,
  PayerDecisionSchema,
  PayerPolicySchema,
  PharmacyHandoffSchema,
  PolicyCriterionSchema,
  SubmissionAttemptSchema,
  SubmissionPacketSchema,
  TreatmentAccessCaseSchema,
  TreatmentOrderSchema,
} from "@tacc/shared-schemas";
import {
  appealIngredients,
  defaultDemoToggles,
  denialLetterScenarios,
  missingEvidenceMappings,
  missingSafetyLabScenario,
  pharmacyHandoffDetails,
  seedAgentTraces,
  seedAppealPacket,
  seedArtifacts,
  seedAttachments,
  seedAuditEvents,
  seedCase,
  seedCriteria,
  seedEvidenceMappings,
  seedHumanTasks,
  seedLabs,
  seedMedicationHistory,
  seedOrder,
  seedPatient,
  seedPayerDecisions,
  seedPayerPolicy,
  seedPharmacyHandoff,
  seedSubmissionAttempts,
  seedSubmissionPacket,
  treatmentAccessDemoFixture,
} from "../src/index";

describe("demo data", () => {
  it("validates every fixture module against shared schemas", () => {
    expect(() => TreatmentAccessCaseSchema.parse(seedCase)).not.toThrow();
    expect(() => PatientSnapshotSchema.parse(seedPatient)).not.toThrow();
    expect(() => TreatmentOrderSchema.parse(seedOrder)).not.toThrow();
    expect(() => PayerPolicySchema.parse(seedPayerPolicy)).not.toThrow();
    expect(
      seedCriteria.map((item) => PolicyCriterionSchema.parse(item)),
    ).toHaveLength(seedCriteria.length);
    expect(
      seedArtifacts.map((item) => EvidenceArtifactSchema.parse(item)),
    ).toHaveLength(seedArtifacts.length);
    expect(
      seedAttachments.map((item) => AttachmentMetadataSchema.parse(item)),
    ).toHaveLength(seedAttachments.length);
    expect(seedLabs.map((item) => LabResultSchema.parse(item))).toHaveLength(
      seedLabs.length,
    );
    expect(
      seedMedicationHistory.map((item) =>
        MedicationHistoryEntrySchema.parse(item),
      ),
    ).toHaveLength(seedMedicationHistory.length);
    expect(
      seedEvidenceMappings.map((item) => EvidenceMappingSchema.parse(item)),
    ).toHaveLength(seedEvidenceMappings.length);
    expect(() =>
      SubmissionPacketSchema.parse(seedSubmissionPacket),
    ).not.toThrow();
    expect(
      seedSubmissionAttempts.map((item) => SubmissionAttemptSchema.parse(item)),
    ).toHaveLength(seedSubmissionAttempts.length);
    expect(
      seedPayerDecisions.map((item) => PayerDecisionSchema.parse(item)),
    ).toHaveLength(seedPayerDecisions.length);
    expect(() => AppealPacketSchema.parse(seedAppealPacket)).not.toThrow();
    expect(() =>
      PharmacyHandoffSchema.parse(seedPharmacyHandoff),
    ).not.toThrow();
    expect(
      seedAgentTraces.map((item) => AgentTraceSchema.parse(item)),
    ).toHaveLength(seedAgentTraces.length);
    expect(
      seedAuditEvents.map((item) => AuditEventSchema.parse(item)),
    ).toHaveLength(seedAuditEvents.length);
    expect(() =>
      DemoFixtureSchema.parse(treatmentAccessDemoFixture),
    ).not.toThrow();
  });

  it("keeps criteria and evidence mappings aligned", () => {
    const criterionIds = new Set(
      seedCriteria.map((criterion) => criterion.criterion_id),
    );

    expect(
      seedEvidenceMappings.every((mapping) =>
        criterionIds.has(mapping.criterion_id),
      ),
    ).toBe(true);
  });

  it("keeps artifacts and attachments aligned", () => {
    const artifactIds = new Set(
      seedArtifacts.map((artifact) => artifact.artifact_id),
    );

    expect(
      seedAttachments.every((attachment) =>
        artifactIds.has(attachment.artifact_id),
      ),
    ).toBe(true);
  });

  it("models the missing safety evidence scenario without mutating baseline evidence", () => {
    const baseline = seedEvidenceMappings.find(
      (mapping) => mapping.criterion_id === "criterion-safety-screen",
    );
    const missing = missingEvidenceMappings.find(
      (mapping) => mapping.criterion_id === "criterion-safety-screen",
    );

    expect(baseline?.status).toBe("found");
    expect(missing?.status).toBe("missing");
    expect(missing?.artifact_id).toBeNull();
    expect(
      missingSafetyLabScenario.every((lab) => lab.status === "missing"),
    ).toBe(true);
  });

  it("provides denial, appeal, pharmacy, and toggle exports for downstream lanes", () => {
    expect(Object.keys(denialLetterScenarios)).toEqual([
      "step_therapy",
      "safety_screen",
      "medical_necessity",
    ]);
    expect(appealIngredients.appeal_id).toBe(seedAppealPacket.appeal_id);
    expect(pharmacyHandoffDetails.handoff_id).toBe(
      seedPharmacyHandoff.handoff_id,
    );
    expect(defaultDemoToggles).toMatchObject({
      missing_safety_lab: false,
      payer_api_unavailable: false,
      denial_reason: "step_therapy",
      clinician_rejects_assertion: false,
    });
  });

  it("contains clearly synthetic labels and no obvious real PHI markers", () => {
    const fixtureText = JSON.stringify(treatmentAccessDemoFixture);

    expect(fixtureText).toContain("Synthetic");
    expect(fixtureText).toContain("Fictional");
    expect(fixtureText).not.toMatch(/\b\d{3}-\d{2}-\d{4}\b/);
    expect(fixtureText).not.toMatch(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    );
    expect(fixtureText).not.toMatch(
      /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/,
    );
    expect(fixtureText).not.toMatch(/\b(?:MRN|SSN|DOB|NPI|DEA)\b/i);
    expect(fixtureText).not.toMatch(/https?:\/\//i);
    expect(seedPatient.synthetic_name).toMatch(/^Synthetic Patient/);
    expect(seedPatient.member_id).toMatch(/^member-syn-/);
    expect(seedOrder.ordering_provider).toMatch(/^Demo /);
  });

  it("keeps appeal draft administrative and clinician-reviewed", () => {
    expect(seedAppealPacket.draft_text).toContain(
      "Administrative draft for clinician review",
    );
    expect(seedAppealPacket.draft_text).toContain(
      "not medical or legal advice",
    );
    expect(seedAppealPacket.clinician_approved).toBe(false);
  });
});
