import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";
import { createChatCompletion } from "@/lib/llm/client";
import { sendTelegramMessage } from "@/lib/telegram";
import { getRelevantMemories } from "@/lib/memory/semantic";

export async function handleTelegramUpdate(update: any, botToken: string): Promise<boolean> {
  try {
    // 1. Handle Callback Query (inline buttons)
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message?.chat?.id;
      const data = cq.data || "";

      if (data.startsWith("switch_") && chatId) {
        const charId = data.replace("switch_", "");
        const user = await prisma.user.findFirst({
          where: { telegramChatId: String(chatId) },
        });

        if (user) {
          const char = await prisma.character.findUnique({
            where: { id: charId },
          });

          if (char) {
            await prisma.user.update({
              where: { id: user.id },
              data: { telegramActiveCharacterId: char.id },
            });

            await sendTelegramMessage(
              botToken,
              chatId,
              `✨ Switched active companion to *${char.name}* (${char.avatarUrl || "🤖"})\n\n"${char.greeting}"`
            );
          }
        }
      }
      return true;
    }

    const message = update.message;
    if (!message || !message.text) {
      return false;
    }

    const chatId = String(message.chat.id);
    const text = message.text.trim();

    // 2. Handle /start <pairing_code>
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const potentialCode = parts[1]?.trim();

      if (potentialCode) {
        const userToPair = await prisma.user.findFirst({
          where: { telegramPairCode: potentialCode },
        });

        if (userToPair) {
          const defaultChar = await prisma.character.findFirst({
            where: { OR: [{ userId: userToPair.id }, { isDefault: true }] },
          });

          await prisma.user.update({
            where: { id: userToPair.id },
            data: {
              telegramChatId: chatId,
              telegramPairCode: null,
              telegramActiveCharacterId: defaultChar?.id || null,
            },
          });

          const charName = defaultChar?.name || "Buddy";
          const charAvatar = defaultChar?.avatarUrl || "🤖";

          await sendTelegramMessage(
            botToken,
            chatId,
            `🎉 *Welcome to BuddyAi!*\n\nYour Telegram account is now linked to your BuddyAi dashboard.\n\nYour active companion is *${charName}* ${charAvatar}.\n\n💬 *Commands:*\n• Just send any text to chat!\n• /switch - Switch companions\n• /status - Check companion stats & model`
          );

          return true;
        }
      }
    }

    // 3. Lookup user by chatId
    const user = await prisma.user.findFirst({
      where: { telegramChatId: chatId },
    });

    if (!user) {
      await sendTelegramMessage(
        botToken,
        chatId,
        "👋 Welcome! Your Telegram account is not yet paired with BuddyAi.\n\nPlease open your BuddyAi Settings ➔ Telegram Bot Sync tab, click 'Generate Pairing Code', and send `/start <code>` here."
      );
      return false;
    }

    // 4. Command: /switch or /buddies
    if (text === "/switch" || text === "/buddies") {
      const characters = await prisma.character.findMany({
        where: {
          OR: [{ userId: user.id }, { isDefault: true }],
        },
        take: 8,
      });

      const keyboard = characters.map((c) => [
        {
          text: `${c.avatarUrl || "🤖"} ${c.name} (${c.tagline.slice(0, 24)}...)`,
          callback_data: `switch_${c.id}`,
        },
      ]);

      await sendTelegramMessage(botToken, chatId, "🎭 *Select your active companion:*", {
        reply_markup: { inline_keyboard: keyboard },
      });

      return true;
    }

    // 5. Command: /status
    if (text === "/status") {
      const activeChar = user.telegramActiveCharacterId
        ? await prisma.character.findUnique({ where: { id: user.telegramActiveCharacterId } })
        : await prisma.character.findFirst({ where: { isDefault: true } });

      const activeKey = await prisma.apiKey.findFirst({
        where: { userId: user.id, isActive: true },
      });

      await sendTelegramMessage(
        botToken,
        chatId,
        `📊 *BuddyAi Companion Status:*\n\n• *Active Companion:* ${activeChar?.name || "None"} ${activeChar?.avatarUrl || ""}\n• *Role:* ${activeChar?.tagline || ""}\n• *Affinity Points:* ${activeChar?.affinityPoints || 0} XP\n• *Active AI Model:* \`${activeKey?.model || "Mock Simulator"}\`\n• *Sync Status:* Connected & Live ⚡`
      );

      return true;
    }

    // 6. Conversational Message
    let activeChar = user.telegramActiveCharacterId
      ? await prisma.character.findUnique({ where: { id: user.telegramActiveCharacterId } })
      : null;

    if (!activeChar) {
      activeChar = await prisma.character.findFirst({
        where: { OR: [{ userId: user.id }, { isDefault: true }] },
      });
    }

    if (!activeChar) {
      await sendTelegramMessage(botToken, chatId, "Please select or create a companion character first.");
      return false;
    }

    let session = await prisma.chatSession.findFirst({
      where: {
        userId: user.id,
        characterId: activeChar.id,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          userId: user.id,
          characterId: activeChar.id,
          title: `Telegram Chat with ${activeChar.name}`,
        },
      });
    }

    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: text,
      },
    });

    // Check for "remember that..." or "remember this..."
    const rememberMatch = text.match(/remember(?:\s+that|\s+this)?[:\s]+(.+)/i);
    if (rememberMatch && rememberMatch[1]) {
      const fact = rememberMatch[1].trim();
      await prisma.companionMemory.create({
        data: {
          userId: user.id,
          characterId: activeChar.id,
          fact,
          category: "fact",
        },
      });
    }

    // Fetch contextually relevant memories using semantic RAG
    const relevantMemories = await getRelevantMemories(
      user.id,
      activeChar.id,
      text,
      8
    );

    let memoryContext = "";
    if (relevantMemories.length > 0) {
      memoryContext =
        "\n\n[MEMORIES ABOUT THE USER]:\n" +
        relevantMemories.join("\n");
    }

    const systemPrompt = `You are ${activeChar.name}, a private AI companion on Telegram.
Tagline: ${activeChar.tagline}
Persona Instructions:
${activeChar.personalityPrompt}

Dynamic tone: ${session.activeMood || activeChar.mood || "friendly"}
Relationship: ${session.activeRelationship || activeChar.relationship || "friend"}
${memoryContext}

FORMATTING RULES FOR TELEGRAM:
- Keep responses concise, warm, conversational, and direct for mobile chat.
- Use Telegram Markdown for formatting.
- Stay strictly in character as ${activeChar.name}. Never mention being an AI model unless in character.`;

    const recentMessages = await prisma.message.findMany({
      where: { sessionId: session.id },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    const conversationContext = recentMessages.reverse().map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const activeKeyRecord = await prisma.apiKey.findFirst({
      where: { userId: user.id, isActive: true },
    });

    let assistantReply = "";

    if (activeKeyRecord) {
      try {
        const plainKey = decryptApiKey({
          encryptedKey: activeKeyRecord.encryptedKey,
          iv: activeKeyRecord.iv,
          authTag: activeKeyRecord.authTag,
        });

        assistantReply = await createChatCompletion({
          baseUrl: activeKeyRecord.baseUrl,
          apiKey: plainKey,
          model: activeKeyRecord.model,
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationContext,
          ],
        });
      } catch (llmErr: any) {
        console.error("Telegram LLM call error:", llmErr);
        assistantReply = `I ran into an issue reaching your LLM provider (${llmErr.message}). Please check your API key in Settings.`;
      }
    } else {
      assistantReply = `Hey! I received your message: "${text}". I'm chatting with you through Telegram! Plug in your active API key in BuddyAi Settings to enable full intelligence.`;
    }

    if (assistantReply.trim()) {
      await prisma.message.create({
        data: {
          sessionId: session.id,
          role: "assistant",
          content: assistantReply.trim(),
        },
      });

      await prisma.character.update({
        where: { id: activeChar.id },
        data: { affinityPoints: { increment: 5 } },
      });

      await prisma.chatSession.update({
        where: { id: session.id },
        data: { updatedAt: new Date() },
      });

      await sendTelegramMessage(botToken, chatId, assistantReply.trim());
    }

    return true;
  } catch (err) {
    console.error("handleTelegramUpdate error:", err);
    return false;
  }
}
