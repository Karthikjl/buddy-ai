import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { voicePitch, voiceRate, voiceName, autoSpeak } = await req.json();

    const character = await prisma.character.findUnique({
      where: { id: params.id },
    });

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const updated = await prisma.character.update({
      where: { id: params.id },
      data: {
        ...(typeof voicePitch === "number" ? { voicePitch } : {}),
        ...(typeof voiceRate === "number" ? { voiceRate } : {}),
        ...(typeof voiceName === "string" ? { voiceName } : {}),
        ...(typeof autoSpeak === "boolean" ? { autoSpeak } : {}),
      },
    });

    return NextResponse.json({ success: true, character: updated });
  } catch (err: any) {
    console.error("Update character voice error:", err);
    return NextResponse.json({ error: err.message || "Failed to update voice" }, { status: 500 });
  }
}
