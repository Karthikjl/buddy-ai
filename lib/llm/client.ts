export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMRequestOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

/**
 * Normalizes OpenAI-compatible base URLs for major AI providers.
 */
export function normalizeBaseUrl(rawUrl: string): {
  baseUrl: string;
  chatEndpoint: string;
  modelsEndpoint: string;
  fallbackModelsEndpoints: string[];
} {
  let url = (rawUrl || "").trim().replace(/\/+$/, "");

  // Provider-specific standard mappings
  if (url.includes("openrouter.ai")) {
    if (!url.includes("/api/v1")) {
      url = "https://openrouter.ai/api/v1";
    }
  } else if (url.includes("generativelanguage.googleapis.com")) {
    url = "https://generativelanguage.googleapis.com/v1beta/openai";
  } else if (url.includes("api.openai.com")) {
    if (!url.endsWith("/v1")) {
      url = "https://api.openai.com/v1";
    }
  } else {
    // Generic OpenAI-compatible custom URL
    if (!url.endsWith("/v1") && !url.endsWith("/v1/")) {
      url = `${url}/v1`;
    }
  }

  if (url.includes("generativelanguage.googleapis.com")) {
    return {
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      chatEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      modelsEndpoint: "https://generativelanguage.googleapis.com/v1beta/models",
      fallbackModelsEndpoints: [
        "https://generativelanguage.googleapis.com/v1/models",
      ],
    };
  }

  const rootUrl = url.replace(/\/v1$/, "");

  const fallbacks: string[] = [
    `${rootUrl}/models`,
    `${rootUrl}/api/tags`,
    `${rootUrl}/api/models`,
  ];

  return {
    baseUrl: url,
    chatEndpoint: `${url}/chat/completions`,
    modelsEndpoint: `${url}/models`,
    fallbackModelsEndpoints: fallbacks,
  };
}

/**
 * Extracts a friendly human-readable error message from provider responses.
 */
function parseErrorMessage(status: number, errorText: string): string {
  try {
    const data = JSON.parse(errorText);
    if (data?.error?.message) return data.error.message;
    if (typeof data?.error === "string") return data.error;
    if (data?.detail) {
      return typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    }
    if (data?.message) return data.message;
  } catch {
    // fallback to text slice
  }

  if (status === 401) return "Invalid API key or authentication required.";
  if (status === 403) return "Access forbidden: Check API key permissions.";
  if (status === 404) return "Endpoint or model not found (HTTP 404).";
  if (status === 429) return "Rate limit exceeded with this provider (HTTP 429).";
  if (status === 500) return "Provider internal server error (HTTP 500).";

  return `HTTP ${status}: ${errorText.slice(0, 160)}`;
}

/**
 * Dual-stack fetch with localhost -> 127.0.0.1 fallback for Windows local environments.
 */
async function resilientFetch(
  url: string,
  options: RequestInit,
  timeoutMs = 12000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const init = {
    ...options,
    signal: controller.signal,
  };

  try {
    const res = await fetch(url, init);
    clearTimeout(timeout);
    return res;
  } catch (err: any) {
    clearTimeout(timeout);

    // If localhost fails, attempt fallback to 127.0.0.1 for local Ollama/LM Studio
    if (url.includes("localhost")) {
      const ipv4Url = url.replace("localhost", "127.0.0.1");
      const fallbackController = new AbortController();
      const fallbackTimeout = setTimeout(() => fallbackController.abort(), timeoutMs);
      try {
        const fallbackRes = await fetch(ipv4Url, {
          ...options,
          signal: fallbackController.signal,
        });
        clearTimeout(fallbackTimeout);
        return fallbackRes;
      } catch {
        clearTimeout(fallbackTimeout);
      }
    }
    throw err;
  }
}

/**
 * Validates connection with an OpenAI-compatible API provider.
 */
export async function testLLMConnection({
  baseUrl,
  apiKey,
  model,
}: {
  baseUrl: string;
  apiKey: string;
  model: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { chatEndpoint, baseUrl: normalizedUrl } = normalizeBaseUrl(baseUrl);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey && apiKey.trim()) {
      headers["Authorization"] = `Bearer ${apiKey.trim()}`;
      if (normalizedUrl.includes("generativelanguage.googleapis.com")) {
        headers["x-goog-api-key"] = apiKey.trim();
      }
    }
    if (normalizedUrl.includes("openrouter.ai")) {
      headers["HTTP-Referer"] = "https://buddyai.local";
      headers["X-Title"] = "BuddyAi Companion";
    }

    const res = await resilientFetch(
      chatEndpoint,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Test ping. Respond with 'OK'." }],
          max_tokens: 5,
          temperature: 0.1,
        }),
      },
      12000
    );

    if (!res.ok) {
      const errorText = await res.text();
      return {
        success: false,
        message: parseErrorMessage(res.status, errorText),
      };
    }

    return { success: true, message: "Connection verified successfully!" };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { success: false, message: "Connection timed out after 12 seconds." };
    }
    return { success: false, message: err.message || "Failed to reach provider endpoint." };
  }
}

/**
 * Initiates an OpenAI-compatible streaming chat completion.
 */
export async function streamChatCompletion({
  baseUrl,
  apiKey,
  model,
  messages,
  temperature = 0.8,
  maxTokens = 1200,
}: LLMRequestOptions): Promise<Response> {
  const { chatEndpoint, baseUrl: normalizedUrl } = normalizeBaseUrl(baseUrl);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey && apiKey.trim()) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
    if (normalizedUrl.includes("generativelanguage.googleapis.com")) {
      headers["x-goog-api-key"] = apiKey.trim();
    }
  }
  if (normalizedUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "https://buddyai.local";
    headers["X-Title"] = "BuddyAi Companion";
  }

  const res = await resilientFetch(
    chatEndpoint,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    },
    60000
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`LLM provider error (${res.status}): ${parseErrorMessage(res.status, errorBody)}`);
  }

  return res;
}

/**
 * Standard non-streaming chat completion for webhook and background responses.
 */
export async function createChatCompletion({
  baseUrl,
  apiKey,
  model,
  messages,
  temperature = 0.8,
  maxTokens = 1200,
}: LLMRequestOptions): Promise<string> {
  const { chatEndpoint, baseUrl: normalizedUrl } = normalizeBaseUrl(baseUrl);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey && apiKey.trim()) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
    if (normalizedUrl.includes("generativelanguage.googleapis.com")) {
      headers["x-goog-api-key"] = apiKey.trim();
    }
  }
  if (normalizedUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "https://buddyai.local";
    headers["X-Title"] = "BuddyAi Companion";
  }

  const res = await resilientFetch(
    chatEndpoint,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    },
    30000
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`LLM provider error (${res.status}): ${parseErrorMessage(res.status, errorBody)}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

/**
 * Dynamically queries the /v1/models endpoint of any provider.
 */
export async function fetchProviderModels({
  baseUrl,
  apiKey,
}: {
  baseUrl: string;
  apiKey?: string;
}): Promise<{
  success: boolean;
  models: string[];
  requiresAuth?: boolean;
  message?: string;
}> {
  try {
    const { modelsEndpoint, fallbackModelsEndpoints, baseUrl: normalizedUrl } =
      normalizeBaseUrl(baseUrl);

    const isGemini =
      normalizedUrl.includes("generativelanguage.googleapis.com") ||
      modelsEndpoint.includes("generativelanguage.googleapis.com");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const cleanKey = apiKey?.trim() || "";
    let targetUrl = modelsEndpoint;

    if (isGemini) {
      if (cleanKey) {
        headers["x-goog-api-key"] = cleanKey;
        targetUrl = modelsEndpoint.includes("?")
          ? `${modelsEndpoint}&key=${encodeURIComponent(cleanKey)}`
          : `${modelsEndpoint}?key=${encodeURIComponent(cleanKey)}`;
      }
      // Note: Do not set Authorization: Bearer on native Gemini list models endpoint to prevent OAuth2 401
    } else {
      if (cleanKey) {
        headers["Authorization"] = `Bearer ${cleanKey}`;
      }
      if (normalizedUrl.includes("openrouter.ai")) {
        headers["HTTP-Referer"] = "https://buddyai.local";
        headers["X-Title"] = "BuddyAi Companion";
      }
    }

    let res: Response;
    try {
      res = await resilientFetch(targetUrl, { method: "GET", headers }, 8000);
    } catch {
      // Try first fallback
      const fallbackBase = fallbackModelsEndpoints[0] || modelsEndpoint;
      const fallbackUrl =
        isGemini && cleanKey
          ? `${fallbackBase}?key=${encodeURIComponent(cleanKey)}`
          : fallbackBase;
      res = await resilientFetch(fallbackUrl, { method: "GET", headers }, 8000);
    }

    // Fallback: If 404, try secondary endpoints
    if (res.status === 404) {
      for (const fallbackUrl of fallbackModelsEndpoints) {
        try {
          const fbUrl =
            isGemini && cleanKey
              ? `${fallbackUrl}?key=${encodeURIComponent(cleanKey)}`
              : fallbackUrl;
          const fallbackRes = await resilientFetch(fbUrl, { method: "GET", headers }, 6000);
          if (fallbackRes.ok) {
            res = fallbackRes;
            break;
          }
        } catch {
          // continue
        }
      }
    }

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        requiresAuth: true,
        models: [],
        message: "API key required by this provider to list account models.",
      };
    }

    if (!res.ok) {
      const errorText = await res.text();
      return {
        success: false,
        models: [],
        message: parseErrorMessage(res.status, errorText),
      };
    }

    const data = await res.json();
    let modelList: string[] = [];

    // OpenAI format: { object: "list", data: [{ id: "gpt-4o", ... }] }
    // Google Gemini format: { models: [{ name: "models/gemini-1.5-flash", ... }] }
    // Ollama format: { models: [{ name: "llama3:latest", ... }] } or { models: ["llama3"] }
    // Ollama tags format: { tags: [{ name: "llama3" }] }
    if (Array.isArray(data?.data)) {
      modelList = data.data.map((m: any) => m.id || m.name).filter(Boolean);
    } else if (Array.isArray(data?.models)) {
      modelList = data.models.map((m: any) => (typeof m === "string" ? m : m.name || m.id || m.model)).filter(Boolean);
    } else if (Array.isArray(data?.tags)) {
      modelList = data.tags.map((m: any) => (typeof m === "string" ? m : m.name || m.id)).filter(Boolean);
    } else if (Array.isArray(data)) {
      modelList = data.map((m: any) => (typeof m === "string" ? m : m.id || m.name)).filter(Boolean);
    }

    // Clean tag suffixes like :latest and models/ prefix from Gemini
    modelList = modelList.map((m) => m.replace(/^models\//, "").replace(/:latest$/, ""));
    modelList.sort((a, b) => a.localeCompare(b));

    const uniqueModels = Array.from(new Set(modelList));

    return {
      success: uniqueModels.length > 0,
      models: uniqueModels,
      message: uniqueModels.length > 0 ? undefined : "No models returned by endpoint.",
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { success: false, models: [], message: "Models request timed out after 8s." };
    }
    return { success: false, models: [], message: err.message || "Failed to reach models endpoint." };
  }
}
