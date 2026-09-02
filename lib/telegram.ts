import { prisma } from "@/lib/prisma";

const TELEGRAM_API_BASE = "https://api.telegram.org";

/**
 * Validates a bot token with Telegram API getMe
 */
export async function testTelegramBotToken(token: string): Promise<{ ok: boolean; username?: string; error?: string }> {
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/getMe`, {
      method: "GET",
    });
    const data = await res.json();
    if (data.ok && data.result) {
      return { ok: true, username: data.result.username };
    }
    return { ok: false, error: data.description || "Invalid bot token" };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to reach Telegram API" };
  }
}

/**
 * Sets the webhook URL for the bot
 */
export async function setTelegramWebhook(token: string, webhookUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    });
    const data = await res.json();
    return !!data.ok;
  } catch {
    return false;
  }
}

/**
 * Sends a message back to a Telegram chat
 */
export async function sendTelegramMessage(
  token: string,
  chatId: string | number,
  text: string,
  options?: {
    reply_markup?: any;
    parse_mode?: "Markdown" | "HTML";
  }
): Promise<boolean> {
  try {
    const payload: any = {
      chat_id: chatId,
      text: text.slice(0, 4000), // Telegram message character limit
      parse_mode: options?.parse_mode || "Markdown",
    };
    if (options?.reply_markup) {
      payload.reply_markup = options.reply_markup;
    }

    let res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data = await res.json();
    // If Markdown parsing fails due to unescaped characters, retry as plain text
    if (!data.ok && payload.parse_mode) {
      delete payload.parse_mode;
      res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      data = await res.json();
    }

    return !!data.ok;
  } catch (err) {
    console.error("sendTelegramMessage error:", err);
    return false;
  }
}

/**
 * Removes any active webhook so getUpdates polling can work locally
 */
export async function deleteTelegramWebhook(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/deleteWebhook`, {
      method: "POST",
    });
    const data = await res.json();
    return !!data.ok;
  } catch {
    return false;
  }
}

/**
 * Fetches new updates via Telegram Bot API getUpdates
 */
export async function getTelegramUpdates(token: string, offset?: number): Promise<any[]> {
  try {
    const url = offset
      ? `${TELEGRAM_API_BASE}/bot${token}/getUpdates?offset=${offset}&timeout=4`
      : `${TELEGRAM_API_BASE}/bot${token}/getUpdates?timeout=4`;
    const res = await fetch(url, { method: "GET" });
    const data = await res.json();
    if (data.ok && Array.isArray(data.result)) {
      return data.result;
    }
    return [];
  } catch (err) {
    console.error("getTelegramUpdates error:", err);
    return [];
  }
}

