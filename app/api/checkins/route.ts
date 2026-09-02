import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";
import { createChatCompletion } from "@/lib/llm/client";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        preferences: true,
        telegramConfig: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const targetCharacterId = body.characterId;

    // Pick character (target or user's default/active)
    const character = targetCharacterId
      ? await prisma.character.findUnique({ where: { id: targetCharacterId } })
      : await prisma.character.findFirst({
          where: { OR: [{ userId: user.id }, { isDefault: true }] },
        });

    if (!character) {
      return NextResponse.json({ error: "No companion character found" }, { status: 404 });
    }

    // Determine time of day for context
    const hour = new Date().getHours();
    let timeGreeting = "today";
    if (hour >= 5 && hour < 12) timeGreeting = "this morning";
    else if (hour >= 12 && hour < 17) timeGreeting = "this afternoon";
    else if (hour >= 17 && hour < 22) timeGreeting = "this evening";
    else timeGreeting = "tonight";

    const prompt = `You are ${character.name}. Persona: ${character.personalityPrompt}.
Write a warm, natural, in-character proactive check-in message (1-2 sentences) to the user ${timeGreeting}.
Do not sound like a generic bot or say "as an AI". Speak as a close friend/companion casually reaching out to say hello and see how they are doing.`;

    // Check for API key
    const activeKeyRecord = await prisma.apiKey.findFirst({
      where: { userId: user.id, isActive: true },
    });

    let checkinMessage = "";
    if (activeKeyRecord) {
      try {
        const plainKey = decryptApiKey({
          encryptedKey: activeKeyRecord.encryptedKey,
          iv: activeKeyRecord.iv,
          authTag: activeKeyRecord.authTag,
        });

        checkinMessage = await createChatCompletion({
          baseUrl: activeKeyRecord.baseUrl,
          apiKey: plainKey,
          model: activeKeyRecord.model,
          messages: [{ role: "system", content: prompt }],
        });
      } catch (err: any) {
        console.error("Check-in LLM generation failed, using fallback:", err.message);
      }
    }

    if (!checkinMessage) {
      const fallbacks: Record<string, string> = {
        morning: `Good morning! Hope you're starting ${timeGreeting} off right. What's on your mind today?`,
        evening: `Hey! Just checking in on you ${timeGreeting}. How did everything go today?`,
      };
      checkinMessage = hour < 14 ? fallbacks.morning : fallbacks.evening;
    }

    // Find or create session
    let chatSession = await prisma.chatSession.findFirst({
      where: { userId: user.id, characterId: character.id },
      orderBy: { updatedAt: "desc" },
    });

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: user.id,
          characterId: character.id,
          title: `Chat with ${character.name}`,
        },
      });
    }

    // Save message to chat
    await prisma.message.create({
      data: {
        sessionId: chatSession.id,
        role: "assistant",
        content: checkinMessage.trim(),
      },
    });

    // Update character lastCheckinAt
    await prisma.character.update({
      where: { id: character.id },
      data: { lastCheckinAt: new Date() },
    });

    // Send Telegram push notification if paired
    let telegramSent = false;
    if (user.telegramChatId && user.telegramConfig?.botToken) {
      telegramSent = await sendTelegramMessage(
        user.telegramConfig.botToken,
        user.telegramChatId,
        `💌 *${character.name} checked in on you:*\n\n"${checkinMessage.trim()}"`
      );
    }

    return NextResponse.json({
      success: true,
      characterName: character.name,
      message: checkinMessage.trim(),
      telegramSent,
      sessionId: chatSession.id,
    });
  } catch (err: any) {
    console.error("Check-in error:", err);
    return NextResponse.json({ error: err.message || "Failed to trigger check-in" }, { status: 500 });
  }
}
