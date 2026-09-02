import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTelegramUpdates, deleteTelegramWebhook } from "@/lib/telegram";
import { handleTelegramUpdate } from "@/lib/telegram-handler";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { telegramConfig: true },
    });

    if (!user || !user.telegramConfig?.botToken) {
      return NextResponse.json({ error: "No active Telegram bot configured" }, { status: 400 });
    }

    const botToken = user.telegramConfig.botToken;

    // Delete any webhook to allow getUpdates polling
    await deleteTelegramWebhook(botToken);

    // Fetch pending updates from Telegram
    const updates = await getTelegramUpdates(botToken);

    let processedCount = 0;
    let highestUpdateId = 0;

    for (const update of updates) {
      if (update.update_id > highestUpdateId) {
        highestUpdateId = update.update_id;
      }
      const success = await handleTelegramUpdate(update, botToken);
      if (success) processedCount++;
    }

    // Acknowledge updates with Telegram if any were received
    if (highestUpdateId > 0) {
      await getTelegramUpdates(botToken, highestUpdateId + 1);
    }

    // Refetch user to check if newly linked
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    return NextResponse.json({
      success: true,
      processedCount,
      isLinked: !!updatedUser?.telegramChatId,
      telegramChatId: updatedUser?.telegramChatId || null,
    });
  } catch (err: any) {
    console.error("Telegram sync error:", err);
    return NextResponse.json({ error: err.message || "Failed to sync updates" }, { status: 500 });
  }
}
