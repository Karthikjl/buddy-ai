import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  let userId: string | undefined;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id;
  }

  const characters = await prisma.character.findMany({
    where: {
      OR: [
        { isDefault: true },
        ...(userId ? [{ userId }] : []),
      ],
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ characters });
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
    const body = await req.json();
    const {
      name,
      gender,
      tagline,
      personalityPrompt,
      avatarUrl,
      greeting,
      mood,
      relationship,
      customImage,
    } = body;

    if (!name || !tagline || !personalityPrompt) {
      return NextResponse.json(
        { error: "Name, tagline, and personality prompt are required" },
        { status: 400 }
      );
    }

    const character = await prisma.character.create({
      data: {
        userId: user.id,
        name: name.trim(),
        gender: gender || "neutral",
        tagline: tagline.trim(),
        personalityPrompt: personalityPrompt.trim(),
        avatarUrl: avatarUrl || "🤖",
        customImage: customImage || null,
        greeting: greeting?.trim() || `Hey there! I'm ${name.trim()}. Great to meet you.`,
        mood: mood || "friendly",
        relationship: relationship || "friend",
        isDefault: false,
      },
    });

    return NextResponse.json({ character }, { status: 201 });
  } catch (err: any) {
    console.error("Create character error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create character" },
      { status: 500 }
    );
  }
}
