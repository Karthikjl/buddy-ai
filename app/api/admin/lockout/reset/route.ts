import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { resetUserLockout, resetAllLockouts } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { userId, resetAll } = body;

    if (resetAll) {
      resetAllLockouts();
      return NextResponse.json({
        success: true,
        message: "All active login lockouts and rate limits have been cleared across the system.",
      });
    }

    if (userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "Target user not found" }, { status: 404 });
      }

      resetUserLockout([
        targetUser.email,
        targetUser.username || "",
        targetUser.name || "",
        targetUser.id,
      ]);

      return NextResponse.json({
        success: true,
        message: `Login lockout and rate limits reset for ${targetUser.username ? `@${targetUser.username}` : targetUser.email}.`,
      });
    }

    // Default: reset all if no specific user provided
    resetAllLockouts();
    return NextResponse.json({
      success: true,
      message: "All active login lockouts have been reset.",
    });
  } catch (err: any) {
    console.error("Reset lockout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to reset lockout" },
      { status: 500 }
    );
  }
}
