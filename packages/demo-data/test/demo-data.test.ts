import { describe, expect, it } from "vitest";
import { TreatmentAccessCaseSchema } from "@tacc/shared-schemas";
import { seedCase, seedCriteria, seedEvidenceMappings } from "../src/index";

describe("demo data", () => {
  it("uses valid shared case schema", () => {
    expect(() => TreatmentAccessCaseSchema.parse(seedCase)).not.toThrow();
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
});
