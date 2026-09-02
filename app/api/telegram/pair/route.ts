import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { telegramConfig: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate pairing code
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const pairCode = `BUDDY-${randomDigits}`;

    await prisma.user.update({
      where: { id: user.id },
      data: { telegramPairCode: pairCode },
    });

    const botUsername = user.telegramConfig?.botUsername;
    const directLink = botUsername
      ? `https://t.me/${botUsername}?start=${pairCode}`
      : null;

    return NextResponse.json({
      pairCode,
      botUsername,
      directLink,
    });
  } catch (err: any) {
    console.error("Generate pair code error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate pair code" }, { status: 500 });
  }
}
