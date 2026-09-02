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

  const chatSession = await prisma.chatSession.findUnique({
    where: { id: params.id },
    include: {
      character: true,
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!chatSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (chatSession.userId !== user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json({ session: chatSession });
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

  const chatSession = await prisma.chatSession.findUnique({
    where: { id: params.id },
  });

  if (!chatSession || chatSession.userId !== user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await prisma.chatSession.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: "Session deleted" });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const chatSession = await prisma.chatSession.findUnique({
    where: { id: params.id },
  });

  if (!chatSession || chatSession.userId !== user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const updated = await prisma.chatSession.update({
    where: { id: params.id },
    data: { title },
  });

  return NextResponse.json({ session: updated });
}
