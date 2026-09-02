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
    const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
    const endpoint = cleanBaseUrl.endsWith("/v1")
      ? `${cleanBaseUrl}/chat/completions`
      : `${cleanBaseUrl}/v1/chat/completions`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Test ping. Respond with 'OK'." }],
        max_tokens: 5,
        temperature: 0.1,
      }),
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errorText = await res.text();
      return {
        success: false,
        message: `HTTP ${res.status}: ${errorText.slice(0, 180)}`,
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
 * Returns a raw Response with a text/event-stream ReadableStream.
 */
export async function streamChatCompletion({
  baseUrl,
  apiKey,
  model,
  messages,
  temperature = 0.8,
  maxTokens = 1200,
}: LLMRequestOptions): Promise<Response> {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  const endpoint = cleanBaseUrl.endsWith("/v1")
    ? `${cleanBaseUrl}/chat/completions`
    : `${cleanBaseUrl}/v1/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  // OpenRouter optional tracking headers
  if (cleanBaseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "https://buddyai.local";
    headers["X-Title"] = "BuddyAi Companion";
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`LLM provider error (${res.status}): ${errorBody}`);
  }

  return res;
}
