import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";
import { streamChatCompletion, ChatMessage } from "@/lib/llm/client";
import { getRelevantMemories } from "@/lib/memory/semantic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      apiKeys: {
        where: { isActive: true },
        take: 1,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const { sessionId, message, regenerate } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        character: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!chatSession || chatSession.userId !== user.id) {
      return NextResponse.json(
        { error: "Chat session not found or access denied" },
        { status: 404 }
      );
    }

    let promptUserMessage = message?.trim() || "";

    if (regenerate) {
      // If regenerating, delete the last assistant message if present
      const lastMsg = chatSession.messages[0];
      if (lastMsg && lastMsg.role === "assistant") {
        await prisma.message.delete({ where: { id: lastMsg.id } });
        chatSession.messages.shift(); // remove from local array
      }
      // If no new message text passed, use the last user message
      if (!promptUserMessage) {
        const lastUser = chatSession.messages.find((m) => m.role === "user");
        if (lastUser) {
          promptUserMessage = lastUser.content;
        }
      }
    } else {
      if (!promptUserMessage) {
        return NextResponse.json(
          { error: "Message content is required" },
          { status: 400 }
        );
      }

      // Save user's message immediately
      await prisma.message.create({
        data: {
          sessionId,
          role: "user",
          content: promptUserMessage,
        },
      });

      // Auto-detect and save memory if user explicitly says "remember that..." or "remember this:"
      const lower = promptUserMessage.toLowerCase();
      const rememberMatch = lower.match(/remember (that|this:|my) (.+)/i);
      if (rememberMatch && rememberMatch[2]) {
        try {
          await prisma.companionMemory.create({
            data: {
              userId: user.id,
              characterId: chatSession.characterId,
              category: "fact",
              fact: rememberMatch[2].trim(),
            },
          });
        } catch (memErr) {
          console.error("Auto memory capture error:", memErr);
        }
      }
    }

    // Check for active API key
    const activeKeyRecord = user.apiKeys[0];

    // If no key is set yet, provide a guided simulated response
    if (!activeKeyRecord) {
      const mockReply = `Hey! I received your message: "${promptUserMessage}". To get real AI responses powered by OpenAI, OpenRouter, Groq, or your local Ollama instance, please configure your API key in the **Settings** page!`;

      await prisma.message.create({
        data: {
          sessionId,
          role: "assistant",
          content: mockReply,
        },
      });

      // Increment affinity points
      await prisma.character.update({
        where: { id: chatSession.characterId },
        data: { affinityPoints: { increment: 5 } },
      });

      // Stream the mock reply word-by-word so UI experiences streaming immediately
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const words = mockReply.split(" ");
          for (let i = 0; i < words.length; i++) {
            controller.enqueue(encoder.encode(words[i] + (i === words.length - 1 ? "" : " ")));
            await new Promise((r) => setTimeout(r, 35));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    }

    // Decrypt key
    let plainApiKey: string;
    try {
      plainApiKey = decryptApiKey({
        encryptedKey: activeKeyRecord.encryptedKey,
        iv: activeKeyRecord.iv,
        authTag: activeKeyRecord.authTag,
      });
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to decrypt active API key. Please re-enter it in Settings." },
        { status: 500 }
      );
    }

    // Fetch relevant Companion Memories using local semantic RAG
    const relevantMemoryLines = await getRelevantMemories(
      user.id,
      chatSession.characterId,
      promptUserMessage,
      10
    );

    // Build context messages
    const history = [...chatSession.messages].reverse();

    // Compose dynamic directives
    const activeMood = chatSession.activeMood || chatSession.character.mood || "friendly";
    const activeRelationship =
      chatSession.activeRelationship || chatSession.character.relationship || "friend";

    let memoryContext = "";
    if (relevantMemoryLines.length > 0) {
      memoryContext =
        "\n\n[MEMORIES ABOUT THE USER - Contextually retrieved memories]:\n" +
        relevantMemoryLines.join("\n") +
        "\nNaturally incorporate these memories when relevant without awkwardly announcing them.";
    }

    const systemPromptWithDynamics = `${chatSession.character.personalityPrompt}

[CURRENT CONVERSATIONAL DYNAMICS]:
- Active Emotional Mood: ${activeMood} (Adapt your tone, vocabulary, and banter to reflect this mood).
- Relationship Dynamic: ${activeRelationship} (Interact with the user according to this dynamic).${memoryContext}`;

    const formattedMessages: ChatMessage[] = [
      {
        role: "system",
        content: systemPromptWithDynamics,
      },
      ...history
        .filter((m) => !regenerate || m.content !== promptUserMessage)
        .map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      {
        role: "user",
        content: promptUserMessage,
      },
    ];

    // Call LLM
    const llmResponse = await streamChatCompletion({
      baseUrl: activeKeyRecord.baseUrl,
      apiKey: plainApiKey,
      model: activeKeyRecord.model,
      messages: formattedMessages,
    });

    if (!llmResponse.body) {
      throw new Error("No response body from LLM provider");
    }

    const reader = llmResponse.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    let fullAssistantReply = "";
    let buffer = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(":")) continue;

              if (trimmed === "data: [DONE]") {
                continue;
              }

              if (trimmed.startsWith("data: ")) {
                try {
                  const dataStr = trimmed.slice(6);
                  const parsed = JSON.parse(dataStr);
                  const delta = parsed.choices?.[0]?.delta?.content || "";
                  if (delta) {
                    fullAssistantReply += delta;
                    controller.enqueue(encoder.encode(delta));
                  }
                } catch {
                  // Ignore malformed chunk
                }
              }
            }
          }

          // Process trailing buffer
          if (buffer.trim().startsWith("data: ")) {
            try {
              const dataStr = buffer.trim().slice(6);
              if (dataStr !== "[DONE]") {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content || "";
                if (delta) {
                  fullAssistantReply += delta;
                  controller.enqueue(encoder.encode(delta));
                }
              }
            } catch {
              // ignore
            }
          }

          // Persist assistant message to DB
          if (fullAssistantReply.trim()) {
            await prisma.message.create({
              data: {
                sessionId,
                role: "assistant",
                content: fullAssistantReply.trim(),
              },
            });

            await prisma.chatSession.update({
              where: { id: sessionId },
              data: { updatedAt: new Date() },
            });

            // Increment companion affinity points
            await prisma.character.update({
              where: { id: chatSession.characterId },
              data: { affinityPoints: { increment: 5 } },
            });
          }

          controller.close();
        } catch (streamErr: any) {
          console.error("Stream reader error:", streamErr);
          controller.error(streamErr);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process chat message" },
      { status: 500 }
    );
  }
}
