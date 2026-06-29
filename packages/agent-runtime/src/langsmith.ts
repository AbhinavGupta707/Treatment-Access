import type { TraceLink } from "@tacc/shared-schemas";
import {
  resolveAgentRuntimeConfig,
  type AgentRuntimeConfig,
  type LangSmithRuntimeConfig,
  type RuntimeEnv,
} from "./config.js";

export type LangSmithTraceMetadata = Record<string, string | number | boolean>;

export type LangSmithTraceConfig = {
  enabled: boolean;
  projectName: string;
  endpoint?: string;
  workspaceId?: string;
  callbacksBackground: boolean;
  metadata: LangSmithTraceMetadata;
};

export function createLangSmithTraceConfig(
  runtimeConfig: AgentRuntimeConfig,
  metadata: LangSmithTraceMetadata = {},
): LangSmithTraceConfig {
  return {
    enabled:
      runtimeConfig.langSmith.tracingEnabled &&
      Boolean(runtimeConfig.langSmith.apiKey),
    projectName: runtimeConfig.langSmith.projectName,
    endpoint: runtimeConfig.langSmith.endpoint,
    workspaceId: runtimeConfig.langSmith.workspaceId,
    callbacksBackground: runtimeConfig.langSmith.callbacksBackground,
    metadata: createLangSmithMetadata(runtimeConfig, metadata),
  };
}

export function createLangSmithTraceConfigFromEnv(
  env: RuntimeEnv = process.env,
  metadata: LangSmithTraceMetadata = {},
): LangSmithTraceConfig {
  return createLangSmithTraceConfig(
    resolveAgentRuntimeConfig(env).config,
    metadata,
  );
}

export function createLangSmithMetadata(
  runtimeConfig: AgentRuntimeConfig,
  metadata: LangSmithTraceMetadata = {},
): LangSmithTraceMetadata {
  return {
    run_mode: runtimeConfig.mode,
    orchestrator: runtimeConfig.orchestrator,
    synthetic: true,
    product: "treatment-access-command-center",
    ...metadata,
  };
}

export function createLangSmithTraceLink(input: {
  traceId?: string;
  runId?: string;
  url?: string;
  runtimeConfig?: AgentRuntimeConfig;
  metadata?: LangSmithTraceMetadata;
}): TraceLink {
  const runtimeConfig =
    input.runtimeConfig ?? resolveAgentRuntimeConfig().config;

  return {
    trace_id: input.traceId,
    run_id: input.runId,
    provider: "langsmith",
    project_name: runtimeConfig.langSmith.projectName,
    url: input.url,
    metadata: createLangSmithMetadata(runtimeConfig, input.metadata),
  };
}

export function langSmithTracingEnabled(
  config: LangSmithRuntimeConfig,
): boolean {
  return config.tracingEnabled && Boolean(config.apiKey);
}
