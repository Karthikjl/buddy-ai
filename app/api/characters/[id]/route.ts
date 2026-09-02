import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const character = await prisma.character.findUnique({
    where: { id: params.id },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  return NextResponse.json({ character });
}

export async function DELETE(
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

  const character = await prisma.character.findUnique({
    where: { id: params.id },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  if (character.isDefault || character.userId !== user.id) {
    return NextResponse.json(
      { error: "Cannot delete default or unauthorized character" },
      { status: 403 }
    );
  }

  await prisma.character.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: "Character deleted" });
}
