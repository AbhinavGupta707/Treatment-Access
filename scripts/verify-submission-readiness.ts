import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

type Check = {
  name: string;
  ok: boolean;
  detail?: string;
};

const requiredPaths = [
  "README.md",
  "LICENSE",
  "docs/submission.md",
  "docs/demo-script.md",
  "docs/architecture.md",
  "docs/testing.md",
  "uipath/screenshots/README.md",
  "uipath/screenshots/manifest.md",
];

const staleClaimPatterns = [
  /\bwill become\b/i,
  /\bcoming soon\b/i,
  /\bTBD\b/i,
  /\bTODO\b/i,
  /\bplaceholder submission\b/i,
  /\bscaffold status\b/i,
];

const checks: Check[] = [];

for (const path of requiredPaths) {
  checks.push({
    name: `required artifact: ${path}`,
    ok: existsSync(resolve(path)),
  });
}

for (const path of [
  "README.md",
  "docs/testing.md",
  "uipath/screenshots/README.md",
  "uipath/screenshots/manifest.md",
]) {
  if (!existsSync(resolve(path))) {
    continue;
  }

  const content = read(path);
  const stalePattern = staleClaimPatterns.find((pattern) =>
    pattern.test(content),
  );
  checks.push({
    name: `no stale scaffold wording: ${path}`,
    ok: !stalePattern,
    detail: stalePattern ? String(stalePattern) : undefined,
  });
}

const qaText = [
  "README.md",
  "docs/submission.md",
  "docs/testing.md",
  "uipath/screenshots/README.md",
  "uipath/screenshots/manifest.md",
]
  .filter((path) => existsSync(resolve(path)))
  .map((path) => read(path))
  .join("\n");

checks.push(
  hasText(
    "synthetic data disclosure",
    qaText,
    /synthetic data|synthetic demo/i,
  ),
  hasText("no real PHI wording", qaText, /no real PHI|not PHI|real PHI/i),
  hasText(
    "mocked-vs-live disclosure",
    qaText,
    /mocked-vs-live|mocked vs live|local synthetic proof|live UiPath proof/i,
  ),
  hasText(
    "clinician review and advice boundary",
    qaText,
    /clinician review|clinician-reviewed/i,
    /not (?:autonomous )?medical or legal advice/i,
  ),
  hasText(
    "live UiPath approval gate",
    qaText,
    /explicit approval/i,
    /Action Center|Data Service|Orchestrator|solution upload|RPA run|robot/i,
  ),
);

const manifest = existsSync(resolve("uipath/screenshots/manifest.md"))
  ? read("uipath/screenshots/manifest.md")
  : "";

checks.push(
  hasText("manifest includes Command Center", manifest, /Command Center/i),
  hasText(
    "manifest includes Mock Payer Portal",
    manifest,
    /Mock Payer Portal/i,
  ),
  hasText(
    "manifest includes exact commands",
    manifest,
    /Command|Exact command/i,
  ),
  hasText("manifest includes manual paths", manifest, /Manual path|manual/i),
  hasText(
    "manifest classifies local proof",
    manifest,
    /local synthetic proof/i,
  ),
  hasText(
    "manifest classifies live proof gaps",
    manifest,
    /live UiPath proof/i,
  ),
);

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  const status = check.ok ? "passed" : "failed";
  const detail = check.detail ? ` - ${check.detail}` : "";
  console.log(`[${status}] ${check.name}${detail}`);
}

if (failed.length > 0) {
  console.error(
    `Submission readiness failed with ${failed.length} issue(s). This check is static and did not mutate live UiPath or payer systems.`,
  );
  process.exit(1);
}

console.log(
  "Submission readiness passed. Static artifact checks found required evidence, safety, and mocked-vs-live disclosures.",
);

function hasText(name: string, content: string, ...patterns: RegExp[]): Check {
  const missingPattern = patterns.find((pattern) => !pattern.test(content));

  return {
    name,
    ok: !missingPattern,
    detail: missingPattern ? `missing ${String(missingPattern)}` : undefined,
  };
}

function read(path: string) {
  return readFileSync(resolve(path), "utf8").replaceAll(
    process.cwd(),
    relative(process.cwd(), process.cwd()) || ".",
  );
}
