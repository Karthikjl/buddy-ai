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
    include: { preferences: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let prefs = user.preferences;
  if (!prefs) {
    prefs = await prisma.userPreference.create({
      data: {
        userId: user.id,
        theme: "midnight",
        fontStyle: "sans",
        bubbleStyle: "modern",
      },
    });
  }

  return NextResponse.json({ preferences: prefs });
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

  const { theme, fontStyle, bubbleStyle } = await req.json();

  const prefs = await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: {
      ...(theme ? { theme } : {}),
      ...(fontStyle ? { fontStyle } : {}),
      ...(bubbleStyle ? { bubbleStyle } : {}),
    },
    create: {
      userId: user.id,
      theme: theme || "midnight",
      fontStyle: fontStyle || "sans",
      bubbleStyle: bubbleStyle || "modern",
    },
  });

  return NextResponse.json({ preferences: prefs });
}
