import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleTelegramUpdate } from "@/lib/telegram-handler";

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Determine which bot token this update belongs to
    const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;

    let botToken = "";
    if (chatId) {
      const user = await prisma.user.findFirst({
        where: { telegramChatId: String(chatId) },
        include: { telegramConfig: true },
      });
      if (user?.telegramConfig?.botToken) {
        botToken = user.telegramConfig.botToken;
      }
    }

    // If still not found, check pair code
    if (!botToken && update.message?.text?.startsWith("/start")) {
      const potentialCode = update.message.text.split(" ")[1]?.trim();
      if (potentialCode) {
        const user = await prisma.user.findFirst({
          where: { telegramPairCode: potentialCode },
          include: { telegramConfig: true },
        });
        if (user?.telegramConfig?.botToken) {
          botToken = user.telegramConfig.botToken;
        }
      }
    }

    if (!botToken) {
      // Fallback to any active bot config
      const anyConfig = await prisma.telegramBotConfig.findFirst({
        where: { isActive: true },
      });
      if (anyConfig?.botToken) {
        botToken = anyConfig.botToken;
      }
    }

    if (botToken) {
      await handleTelegramUpdate(update, botToken);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
