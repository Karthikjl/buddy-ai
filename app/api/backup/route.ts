import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        characters: true,
        chatSessions: {
          include: {
            messages: true,
          },
        },
        memories: true,
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const backupData = {
      version: "1.0",
      type: "buddyai-full-vault-backup",
      exportedAt: new Date().toISOString(),
      user: {
        email: user.email,
        name: user.name,
      },
      preferences: user.preferences,
      characters: user.characters,
      memories: user.memories,
      chatSessions: user.chatSessions,
    };

    const fileName = `buddyai_backup_${new Date().toISOString().split("T")[0]}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    console.error("Backup export error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate backup" }, { status: 500 });
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

    const backup = await req.json();
    if (!backup.characters && !backup.memories) {
      return NextResponse.json({ error: "Invalid backup file structure" }, { status: 400 });
    }

    let importedCharacters = 0;
    let importedMemories = 0;

    // Restore memories
    if (Array.isArray(backup.memories)) {
      for (const mem of backup.memories) {
        if (mem.fact && mem.characterId) {
          // Check if memory already exists
          const existing = await prisma.companionMemory.findFirst({
            where: { userId: user.id, fact: mem.fact },
          });
          if (!existing) {
            await prisma.companionMemory.create({
              data: {
                userId: user.id,
                characterId: mem.characterId,
                category: mem.category || "fact",
                fact: mem.fact,
              },
            });
            importedMemories++;
          }
        }
      }
    }

    // Restore custom characters
    if (Array.isArray(backup.characters)) {
      for (const char of backup.characters) {
        if (char.name && char.personalityPrompt && !char.isDefault) {
          const existingChar = await prisma.character.findFirst({
            where: { userId: user.id, name: char.name },
          });
          if (!existingChar) {
            await prisma.character.create({
              data: {
                userId: user.id,
                name: char.name,
                gender: char.gender || "neutral",
                tagline: char.tagline || "",
                personalityPrompt: char.personalityPrompt,
                avatarUrl: char.avatarUrl || "🤖",
                customImage: char.customImage || null,
                greeting: char.greeting || "Hello!",
                mood: char.mood || "friendly",
                relationship: char.relationship || "friend",
              },
            });
            importedCharacters++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      importedCharacters,
      importedMemories,
    });
  } catch (err: any) {
    console.error("Backup import error:", err);
    return NextResponse.json({ error: err.message || "Failed to restore backup" }, { status: 500 });
  }
}
