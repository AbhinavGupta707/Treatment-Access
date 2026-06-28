import { seedCase, seedCriteria, seedEvidenceMappings } from "@tacc/demo-data";

console.log(
  JSON.stringify(
    {
      case_id: seedCase.case_id,
      criteria: seedCriteria.length,
      evidenceMappings: seedEvidenceMappings.length,
      syntheticDataOnly: true,
    },
    null,
    2,
  ),
);
