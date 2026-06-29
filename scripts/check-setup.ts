import { existsSync } from "node:fs";
import { resolve } from "node:path";

const checks = [
  [
    "Implementation plan",
    "treatment_access_command_center_implementation_plan.md",
  ],
  ["Project instructions", "AGENTS.md"],
  ["UiPath local skills marker", ".agents/README.md"],
  ["Shared schemas", "packages/shared-schemas/src/index.ts"],
  ["Demo data", "packages/demo-data/src/index.ts"],
  ["Mock API", "services/mock-healthcare-api/src/index.ts"],
  ["Command Center app", "apps/command-center/src/main.tsx"],
  ["Mock payer portal", "apps/mock-payer-portal/src/main.tsx"],
  ["UiPath setup docs", "docs/setup-uipath.md"],
  ["UiPath live readiness wrapper", "scripts/uipath-live-readiness.sh"],
  ["UiPath live wiring runbook", "uipath/live-wiring-runbook.md"],
] as const;

const missing = checks.filter(([, path]) => !existsSync(resolve(path)));

if (missing.length > 0) {
  console.error("Setup check failed. Missing:");
  for (const [label, path] of missing) {
    console.error(`- ${label}: ${path}`);
  }
  process.exit(1);
}

console.log("Setup check passed.");
