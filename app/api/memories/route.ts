import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get("characterId");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const memories = await prisma.companionMemory.findMany({
    where: {
      userId: user.id,
      ...(characterId ? { characterId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ memories });
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
    const { characterId, fact, category } = await req.json();

    if (!characterId || !fact?.trim()) {
      return NextResponse.json(
        { error: "characterId and fact are required" },
        { status: 400 }
      );
    }

    const memory = await prisma.companionMemory.create({
      data: {
        userId: user.id,
        characterId,
        fact: fact.trim(),
        category: category || "fact",
      },
    });

    return NextResponse.json({ memory }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to store memory" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing memory ID" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.companionMemory.deleteMany({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ message: "Memory removed" });
}
