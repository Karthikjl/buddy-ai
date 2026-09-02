import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { testTelegramBotToken, setTelegramWebhook } from "@/lib/telegram";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { telegramConfig: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      isConfigured: !!user.telegramConfig?.botToken,
      botUsername: user.telegramConfig?.botUsername || null,
      isActive: user.telegramConfig?.isActive ?? false,
      isLinked: !!user.telegramChatId,
      telegramChatId: user.telegramChatId,
      pairCode: user.telegramPairCode,
    });
  } catch (err: any) {
    console.error("Get telegram config error:", err);
    return NextResponse.json({ error: err.message || "Failed to load config" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { botToken } = await req.json();
    if (!botToken || typeof botToken !== "string") {
      return NextResponse.json({ error: "Bot token is required" }, { status: 400 });
    }

    const cleanToken = botToken.trim();

    // Validate with Telegram
    const testResult = await testTelegramBotToken(cleanToken);
    if (!testResult.ok) {
      return NextResponse.json({ error: testResult.error || "Invalid Telegram bot token" }, { status: 400 });
    }

    // Save or update bot config
    const config = await prisma.telegramBotConfig.upsert({
      where: { userId: user.id },
      update: {
        botToken: cleanToken,
        botUsername: testResult.username || null,
        isActive: true,
      },
      create: {
        userId: user.id,
        botToken: cleanToken,
        botUsername: testResult.username || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      botUsername: testResult.username,
      config,
    });
  } catch (err: any) {
    console.error("Save telegram config error:", err);
    return NextResponse.json({ error: err.message || "Failed to save config" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.telegramBotConfig.deleteMany({
      where: { userId: user.id },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramChatId: null,
        telegramPairCode: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete telegram config error:", err);
    return NextResponse.json({ error: err.message || "Failed to unlink" }, { status: 500 });
  }
}
