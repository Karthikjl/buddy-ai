import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const sessions = await prisma.chatSession.findMany({
    where: { userId: user.id },
    include: {
      character: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          tagline: true,
          mood: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
          createdAt: true,
          role: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const { characterId, title } = await req.json();

    if (!characterId) {
      return NextResponse.json(
        { error: "characterId is required" },
        { status: 400 }
      );
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    const chatSession = await prisma.chatSession.create({
      data: {
        userId: user.id,
        characterId,
        title: title || `Chat with ${character.name}`,
        messages: {
          create: {
            role: "assistant",
            content: character.greeting,
          },
        },
      },
      include: {
        character: true,
        messages: true,
      },
    });

    return NextResponse.json({ session: chatSession }, { status: 201 });
  } catch (err: any) {
    console.error("Create session error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create chat session" },
      { status: 500 }
    );
  }
}
