import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";
import { streamChatCompletion, ChatMessage } from "@/lib/llm/client";

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
    const { sessionId, message } = await req.json();

    if (!sessionId || !message?.trim()) {
      return NextResponse.json(
        { error: "Session ID and message are required" },
        { status: 400 }
      );
    }

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        character: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 16,
        },
      },
    });

    if (!chatSession || chatSession.userId !== user.id) {
      return NextResponse.json(
        { error: "Chat session not found or access denied" },
        { status: 404 }
      );
    }

    // Save user's message immediately
    await prisma.message.create({
      data: {
        sessionId,
        role: "user",
        content: message.trim(),
      },
    });

    // Check for active API key
    const activeKeyRecord = user.apiKeys[0];

    // If no key is set yet, provide a guided simulated response
    if (!activeKeyRecord) {
      const mockReply = `Hey! I received your message: "${message.trim()}". To get real AI responses powered by OpenAI, OpenRouter, Groq, or your local Ollama instance, please configure your API key in the **Settings** page!`;

      await prisma.message.create({
        data: {
          sessionId,
          role: "assistant",
          content: mockReply,
        },
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

    // Build context messages
    // Messages in DB were fetched desc, reverse them to asc order
    const history = [...chatSession.messages].reverse();

    const formattedMessages: ChatMessage[] = [
      {
        role: "system",
        content: chatSession.character.personalityPrompt,
      },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
      {
        role: "user",
        content: message.trim(),
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
                  // If not json or malformed chunk, pass through if it's raw text
                }
              }
            }
          }

          // Process remaining buffer
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

          // Save assistant message to DB after stream completion
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
