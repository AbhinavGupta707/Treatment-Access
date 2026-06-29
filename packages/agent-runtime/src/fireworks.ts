import {
  resolveAgentRuntimeConfig,
  type AgentRuntimeConfig,
  type FireworksRuntimeConfig,
  type RuntimeEnv,
} from "./config.js";

export type FireworksChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

export type FireworksChatCompletionRequest = {
  model?: string;
  messages: FireworksChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
  tools?: unknown[];
  tool_choice?: unknown;
};

export type FireworksChatCompletionResponse = {
  id?: string;
  model?: string;
  choices?: Array<{
    index?: number;
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: unknown[];
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export type FireworksConnectivityResult = {
  status: "configured" | "skipped" | "ok" | "missing_config" | "failed";
  provider: "fireworks";
  model: string;
  baseUrl: string;
  checkedAt: string;
  message: string;
  latencyMs?: number;
};

export type FireworksClient = {
  readonly config: FireworksRuntimeConfig;
  isConfigured(): boolean;
  chatCompletionsCreate(
    request: FireworksChatCompletionRequest,
  ): Promise<FireworksChatCompletionResponse>;
  checkConnectivity(options?: {
    callModel?: boolean;
  }): Promise<FireworksConnectivityResult>;
};

export function createFireworksClient(
  configOrRuntime: FireworksRuntimeConfig | AgentRuntimeConfig,
): FireworksClient {
  const config =
    "fireworks" in configOrRuntime
      ? configOrRuntime.fireworks
      : configOrRuntime;

  return {
    config,
    isConfigured: () => Boolean(config.apiKey),
    chatCompletionsCreate: (request) => callChatCompletions(config, request),
    checkConnectivity: (options) => checkFireworksConnectivity(config, options),
  };
}

export async function checkFireworksConnectivity(
  configOrRuntime?: FireworksRuntimeConfig | AgentRuntimeConfig,
  options: { callModel?: boolean } = {},
): Promise<FireworksConnectivityResult> {
  const config = configOrRuntime
    ? "fireworks" in configOrRuntime
      ? configOrRuntime.fireworks
      : configOrRuntime
    : resolveAgentRuntimeConfig().config.fireworks;
  const checkedAt = new Date().toISOString();

  if (!config.apiKey) {
    return {
      status: "missing_config",
      provider: "fireworks",
      model: config.agentModel,
      baseUrl: config.baseUrl,
      checkedAt,
      message: "FIREWORKS_API_KEY is not set.",
    };
  }

  if (!options.callModel) {
    return {
      status: "configured",
      provider: "fireworks",
      model: config.agentModel,
      baseUrl: config.baseUrl,
      checkedAt,
      message:
        "Fireworks configuration is present. Model call skipped by readiness settings.",
    };
  }

  const started = Date.now();
  try {
    await callChatCompletions(config, {
      model: config.fastModel,
      messages: [
        {
          role: "system",
          content:
            "Return a tiny JSON readiness response for a synthetic healthcare demo.",
        },
        {
          role: "user",
          content:
            'Respond with {"ready":true,"synthetic":true} and no clinical advice.',
        },
      ],
      temperature: 0,
      max_tokens: 32,
      response_format: { type: "json_object" },
    });

    return {
      status: "ok",
      provider: "fireworks",
      model: config.fastModel,
      baseUrl: config.baseUrl,
      checkedAt,
      message: "Fireworks model call succeeded.",
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      status: "failed",
      provider: "fireworks",
      model: config.fastModel,
      baseUrl: config.baseUrl,
      checkedAt,
      message: error instanceof Error ? error.message : "Unknown error.",
      latencyMs: Date.now() - started,
    };
  }
}

export async function checkFireworksConnectivityFromEnv(
  env: RuntimeEnv = process.env,
  options: { callModel?: boolean } = {},
): Promise<FireworksConnectivityResult> {
  return checkFireworksConnectivity(
    resolveAgentRuntimeConfig(env).config.fireworks,
    options,
  );
}

async function callChatCompletions(
  config: FireworksRuntimeConfig,
  request: FireworksChatCompletionRequest,
): Promise<FireworksChatCompletionResponse> {
  if (!config.apiKey) {
    throw new Error("FIREWORKS_API_KEY is required for Fireworks model calls.");
  }

  const response = await fetch(
    `${trimTrailingSlash(config.baseUrl)}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...request,
        model: request.model ?? config.agentModel,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Fireworks chat completion failed with HTTP ${response.status}: ${summarizeErrorBody(
        errorBody,
      )}`,
    );
  }

  return (await response.json()) as FireworksChatCompletionResponse;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function summarizeErrorBody(value: string): string {
  if (!value) {
    return "(empty response)";
  }
  return value.replace(/\s+/g, " ").slice(0, 240);
}
