import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const WEBHOOK_URL = process.env.LOCAL_WEBHOOK_URL || "http://localhost:3005/api/telegram/webhook";
const TELEGRAM_BASE = "https://api.telegram.org";

console.log("🚀 BuddyAi Telegram Background Daemon starting...");

let isRunning = true;
const offsets = new Map();

async function pollBot(botToken) {
  try {
    const offset = offsets.get(botToken) || 0;
    const url = `${TELEGRAM_BASE}/bot${botToken}/getUpdates?offset=${offset}&timeout=15`;
    
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 409) {
        // Webhook might be registered, delete it so getUpdates works
        await fetch(`${TELEGRAM_BASE}/bot${botToken}/deleteWebhook`, { method: "POST" });
      }
      return;
    }

    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) {
      return;
    }

    let highestId = offset;
    for (const update of data.result) {
      if (update.update_id >= highestId) {
        highestId = update.update_id + 1;
      }

      console.log(`📩 Received update ${update.update_id}:`, update.message?.text || "[callback_query]");

      // Dispatch to local webhook
      try {
        const whRes = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update),
        });
        const whData = await whRes.json();
        console.log(`✅ Processed update ${update.update_id}:`, whData);
      } catch (whErr) {
        console.error(`❌ Webhook dispatch error for ${update.update_id}:`, whErr.message);
      }
    }

    offsets.set(botToken, highestId);
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Polling error:", err.message);
    }
  }
}

async function loop() {
  while (isRunning) {
    try {
      const activeConfigs = await prisma.telegramBotConfig.findMany({
        where: { isActive: true },
      });

      if (activeConfigs.length === 0) {
        await new Promise((r) => setTimeout(r, 4000));
        continue;
      }

      await Promise.all(activeConfigs.map((cfg) => pollBot(cfg.botToken)));
    } catch (err) {
      console.error("Daemon loop error:", err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

loop().catch(console.error);

process.on("SIGINT", async () => {
  console.log("Stopping Telegram daemon...");
  isRunning = false;
  await prisma.$disconnect();
  process.exit(0);
});
