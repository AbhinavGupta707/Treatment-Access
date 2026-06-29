import { AgentModeSchema, type AgentMode } from "@tacc/shared-schemas";

const defaultFireworksBaseUrl = "https://api.fireworks.ai/inference/v1";
const defaultAgentModel = "accounts/fireworks/models/kimi-k2-instruct-0905";
const defaultReasoningModel = "accounts/fireworks/models/deepseek-v3p1";
const defaultEmbeddingModel = "fireworks/qwen3-embedding-8b";
const defaultRerankerModel = "fireworks/qwen3-reranker-8b";

export type RuntimeEnv = Record<string, string | undefined>;

export type FireworksRuntimeConfig = {
  apiKey?: string;
  baseUrl: string;
  agentModel: string;
  reasoningModel: string;
  fastModel: string;
  embeddingModel: string;
  rerankerModel: string;
};

export type LangSmithRuntimeConfig = {
  tracingEnabled: boolean;
  apiKey?: string;
  projectName: string;
  endpoint?: string;
  workspaceId?: string;
  callbacksBackground: boolean;
};

export type AgentRuntimeConfig = {
  mode: AgentMode;
  orchestrator: "local" | "uipath";
  fireworks: FireworksRuntimeConfig;
  langSmith: LangSmithRuntimeConfig;
};

export type RuntimeConfigValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  config: AgentRuntimeConfig;
  safeEnvSummary: Record<string, string>;
};

export function resolveAgentRuntimeConfig(
  env: RuntimeEnv = process.env,
): RuntimeConfigValidation {
  const modeParse = AgentModeSchema.safeParse(
    env.AGENT_MODE ?? "deterministic",
  );
  const mode = modeParse.success ? modeParse.data : "deterministic";
  const orchestrator = env.AGENT_ORCHESTRATOR === "uipath" ? "uipath" : "local";
  const tracingEnabled = parseBoolean(env.LANGSMITH_TRACING);
  const config: AgentRuntimeConfig = {
    mode,
    orchestrator,
    fireworks: {
      apiKey: emptyToUndefined(env.FIREWORKS_API_KEY),
      baseUrl: env.FIREWORKS_BASE_URL ?? defaultFireworksBaseUrl,
      agentModel: env.FIREWORKS_AGENT_MODEL ?? defaultAgentModel,
      reasoningModel: env.FIREWORKS_REASONING_MODEL ?? defaultReasoningModel,
      fastModel: env.FIREWORKS_FAST_MODEL ?? defaultReasoningModel,
      embeddingModel: env.FIREWORKS_EMBEDDING_MODEL ?? defaultEmbeddingModel,
      rerankerModel: env.FIREWORKS_RERANKER_MODEL ?? defaultRerankerModel,
    },
    langSmith: {
      tracingEnabled,
      apiKey: emptyToUndefined(env.LANGSMITH_API_KEY),
      projectName: env.LANGSMITH_PROJECT ?? "Treatment Access Command Center",
      endpoint: emptyToUndefined(env.LANGSMITH_ENDPOINT),
      workspaceId: emptyToUndefined(env.LANGSMITH_WORKSPACE_ID),
      callbacksBackground: parseBoolean(
        env.LANGCHAIN_CALLBACKS_BACKGROUND,
        false,
      ),
    },
  };

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!modeParse.success) {
    errors.push("AGENT_MODE must be either deterministic or live.");
  }
  if (mode === "live" && !config.fireworks.apiKey) {
    errors.push("FIREWORKS_API_KEY is required when AGENT_MODE=live.");
  }
  if (config.langSmith.tracingEnabled && !config.langSmith.apiKey) {
    errors.push("LANGSMITH_API_KEY is required when LANGSMITH_TRACING=true.");
  }
  if (mode === "deterministic" && config.fireworks.apiKey) {
    warnings.push(
      "FIREWORKS_API_KEY is present but AGENT_MODE=deterministic; model calls are disabled.",
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    config,
    safeEnvSummary: safeRuntimeEnvSummary(config),
  };
}

export function safeRuntimeEnvSummary(
  config: AgentRuntimeConfig,
): Record<string, string> {
  return {
    AGENT_MODE: config.mode,
    AGENT_ORCHESTRATOR: config.orchestrator,
    FIREWORKS_API_KEY: secretState(config.fireworks.apiKey),
    FIREWORKS_BASE_URL: config.fireworks.baseUrl,
    FIREWORKS_AGENT_MODEL: config.fireworks.agentModel,
    FIREWORKS_REASONING_MODEL: config.fireworks.reasoningModel,
    FIREWORKS_FAST_MODEL: config.fireworks.fastModel,
    FIREWORKS_EMBEDDING_MODEL: config.fireworks.embeddingModel,
    FIREWORKS_RERANKER_MODEL: config.fireworks.rerankerModel,
    LANGSMITH_TRACING: String(config.langSmith.tracingEnabled),
    LANGSMITH_API_KEY: secretState(config.langSmith.apiKey),
    LANGSMITH_PROJECT: config.langSmith.projectName,
    LANGSMITH_ENDPOINT: config.langSmith.endpoint ?? "(default)",
    LANGSMITH_WORKSPACE_ID: secretState(config.langSmith.workspaceId),
    LANGCHAIN_CALLBACKS_BACKGROUND: String(
      config.langSmith.callbacksBackground,
    ),
  };
}

export function secretState(value: string | undefined): "set" | "missing" {
  return value ? "set" : "missing";
}

function parseBoolean(
  value: string | undefined,
  defaultValue = false,
): boolean {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function emptyToUndefined(value: string | undefined): string | undefined {
  return value && value.trim() !== "" ? value : undefined;
}
