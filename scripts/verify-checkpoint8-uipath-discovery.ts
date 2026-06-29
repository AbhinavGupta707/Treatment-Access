import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Check = {
  name: string;
  detail?: string;
};

const checks: Check[] = [];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(path: string) {
  const absolutePath = resolve(path);
  assert(existsSync(absolutePath), `Missing required file: ${path}`);
  return readFileSync(absolutePath, "utf8");
}

function assertIncludes(name: string, content: string, values: string[]) {
  const missing = values.filter((value) => !content.includes(value));
  assert(missing.length === 0, `${name} missing: ${missing.join(", ")}`);
  checks.push({ name, detail: `${values.length} required values present` });
}

function assertMatches(name: string, content: string, patterns: RegExp[]) {
  const normalized = content.replace(/\s+/g, " ");
  const missing = patterns.filter((pattern) => !pattern.test(normalized));
  assert(
    missing.length === 0,
    `${name} missing: ${missing.map(String).join(", ")}`,
  );
  checks.push({ name, detail: `${patterns.length} required patterns present` });
}

const matrixPath = "docs/checkpoint-8-live-proof-approval-matrix.md";
const handoffPath = "docs/checkpoint-8-lane-handoffs/cloud-discovery.md";

const matrix = readText(matrixPath);
const handoff = readText(handoffPath);
const combined = `${matrix}\n${handoff}`;

assertIncludes("checkpoint 8 discovery files", combined, [
  "TreatmentAccessHackathon",
  "7986316",
  "4fba2fa1-012b-469a-b6aa-e5be3811c173",
  "galacticus",
  "DefaultTenant",
]);

assertIncludes("read-only discovery commands", combined, [
  "uip login status --output json",
  "uip login tenant list --output json",
  "uip tools list --output json",
  "uip or folders get TreatmentAccessHackathon --output json",
  "uip or folders runtimes TreatmentAccessHackathon --output json",
  "uip or machines list --folder-path TreatmentAccessHackathon --all-fields --output json",
  "uip or sessions attended list --folder-path TreatmentAccessHackathon --output json",
  "uip or sessions unattended list --folder-path TreatmentAccessHackathon --output json",
  "uip or processes list --folder-path TreatmentAccessHackathon --output json",
  "uip or jobs list --folder-path TreatmentAccessHackathon --output json",
  "uip tasks users 7986316 --output json",
  "uip tasks list --folder-id 7986316 --output json",
  "uip df entities list --output json",
  "uip solution project list --solution-folder uipath/solution/treatment-access-command-center --output json",
]);

assertMatches("layer-order diagnosis", combined, [
  /Login, organization, tenant, and folder/i,
  /Product\/tool registration and command discovery/i,
  /Activation and permissions/i,
  /Runtime readiness/i,
]);

assertMatches("discovery results", combined, [
  /Development` runtime reports total `1`, connected `1`, available `1`/i,
  /No processes are currently bound/i,
  /No tasks were listed/i,
  /no entities were listed/i,
  /No published solution packages/i,
  /no Studio Web solutions found/i,
]);

assertIncludes("approval gates", combined, [
  "uip df entities create",
  "uip df records insert",
  "uip api-workflow run",
  "uip maestro case debug",
  "uip agent run",
  "uip codedagent run",
  "uip tasks assign",
  "uip tasks complete",
  "uip or jobs start",
  "uip or packages upload",
  "uip rpa run",
  "UiPath Assistant run of `PayerPortalFallback`",
  "uip solution upload",
  "uip solution publish",
  "uip solution deploy run",
  "uip solution deploy activate",
]);

assertMatches("minimum proof path", combined, [
  /H1 first/i,
  /Data Fabric\/Data Service event entity/i,
  /Command Center show it as UiPath-owned governed state/i,
  /H2: create\/read\/complete a live Action Center/i,
  /H3: publish\/deploy\/run `PayerPortalFallback`/i,
]);

assertMatches("safety boundaries", combined, [
  /No live UiPath resource was created/i,
  /explicit user approval/i,
  /real PHI/i,
  /real payer\/provider credentials/i,
  /real payer submission/i,
]);

console.log("Checkpoint 8 UiPath discovery verifier passed.");
for (const check of checks) {
  console.log(`- ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
}
