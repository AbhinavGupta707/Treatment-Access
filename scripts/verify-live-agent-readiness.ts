import {
  checkFireworksConnectivity,
  createLangSmithTraceConfig,
  resolveAgentRuntimeConfig,
} from "@tacc/agent-runtime";

const args = new Set(process.argv.slice(2));
const callModel =
  args.has("--call-model") ||
  ["1", "true", "yes", "on"].includes(
    (process.env.LIVE_AGENT_READINESS_CALL_MODEL ?? "").toLowerCase(),
  );
const requireLive = args.has("--require-live");
const validation = resolveAgentRuntimeConfig();

if (requireLive && validation.config.mode !== "live") {
  validation.errors.push(
    "AGENT_MODE=live is required when --require-live is passed.",
  );
}

console.log("Live agent readiness configuration:");
console.log(JSON.stringify(validation.safeEnvSummary, null, 2));

if (validation.warnings.length > 0) {
  console.warn("Warnings:");
  for (const warning of validation.warnings) {
    console.warn(`- ${warning}`);
  }
}

if (!validation.ok || validation.errors.length > 0) {
  console.error("Readiness failed:");
  for (const error of validation.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

const fireworks = await checkFireworksConnectivity(validation.config, {
  callModel,
});
const langSmith = createLangSmithTraceConfig(validation.config, {
  case_id: "case-readiness-synthetic",
  run_id: "run-readiness-synthetic",
  synthetic: true,
});

console.log("Provider readiness:");
console.log(
  JSON.stringify(
    {
      fireworks,
      langsmith: {
        enabled: langSmith.enabled,
        projectName: langSmith.projectName,
        endpoint: langSmith.endpoint ?? "(default)",
        workspaceId: validation.safeEnvSummary.LANGSMITH_WORKSPACE_ID,
        callbacksBackground: langSmith.callbacksBackground,
        metadata: langSmith.metadata,
      },
      modelCallAttempted: callModel,
      sideEffects:
        "none; no UiPath, payer, Action Center, or Data Service calls",
    },
    null,
    2,
  ),
);

if (callModel && fireworks.status !== "ok") {
  console.error(`Readiness model call failed: ${fireworks.message}`);
  process.exit(1);
}

console.log("Live agent readiness smoke passed.");
