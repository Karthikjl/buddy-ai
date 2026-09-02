import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "md";

  const chatSession = await prisma.chatSession.findUnique({
    where: { id: params.id },
    include: {
      character: true,
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!chatSession || chatSession.userId !== user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (format === "json") {
    return NextResponse.json(chatSession);
  }

  // Generate Markdown
  const lines: string[] = [
    `# Conversation with ${chatSession.character.name}`,
    `**Session ID:** \`${chatSession.id}\`  `,
    `**Date:** ${new Date(chatSession.createdAt).toLocaleString()}  `,
    `**Mood:** ${chatSession.activeMood || chatSession.character.mood || "Normal"} | **Dynamic:** ${chatSession.activeRelationship || chatSession.character.relationship || "Companion"}  `,
    `\n---\n`,
  ];

  for (const msg of chatSession.messages) {
    const speaker = msg.role === "user" ? user.name || "User" : chatSession.character.name;
    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    lines.push(`### ${speaker} (${time}):\n${msg.content}\n`);
  }

  const markdownContent = lines.join("\n");
  const filename = `chat-${chatSession.character.name.toLowerCase()}-${Date.now()}.md`;

  return new Response(markdownContent, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
