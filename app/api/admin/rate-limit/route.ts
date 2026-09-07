import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { resetUserLockout, resetAllLockouts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [enabledSetting, windowSetting, maxSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "loginRateLimit_enabled" } }),
      prisma.systemSetting.findUnique({ where: { key: "loginRateLimit_window" } }),
      prisma.systemSetting.findUnique({ where: { key: "loginRateLimit_maxAttempts" } }),
    ]);

    const enabled = enabledSetting ? enabledSetting.value !== "false" : true;
    const windowMinutes = windowSetting ? Math.max(1, parseInt(windowSetting.value, 10) || 15) : 15;
    const maxAttempts = maxSetting ? Math.max(1, parseInt(maxSetting.value, 10) || 20) : 20;

    return NextResponse.json({
      enabled,
      windowMinutes,
      maxAttempts,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch rate limit settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Super Admin required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, identifier, enabled, windowMinutes, maxAttempts } = body;

    // Handle Lockout Reset action
    if (action === "reset") {
      if (!identifier || identifier === "__all__") {
        resetAllLockouts();
        return NextResponse.json({ success: true, message: "All active lockouts cleared successfully" });
      }

      const clean = identifier.trim().toLowerCase();
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: clean },
            { username: clean },
            { name: clean },
            { id: clean },
          ],
        },
      });

      if (user) {
        resetUserLockout([user.email, user.username || "", user.name || "", user.id, clean]);
      } else {
        resetUserLockout([clean]);
      }

      return NextResponse.json({ success: true, message: `Lockout reset for ${identifier}` });
    }

    // Handle Configuration Update
    const updates: Promise<any>[] = [];

    if (enabled !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: { key: "loginRateLimit_enabled" },
          update: { value: enabled ? "true" : "false" },
          create: { key: "loginRateLimit_enabled", value: enabled ? "true" : "false" },
        })
      );
    }

    if (windowMinutes !== undefined) {
      const validWindow = Math.max(1, parseInt(windowMinutes, 10) || 15);
      updates.push(
        prisma.systemSetting.upsert({
          where: { key: "loginRateLimit_window" },
          update: { value: validWindow.toString() },
          create: { key: "loginRateLimit_window", value: validWindow.toString() },
        })
      );
    }

    if (maxAttempts !== undefined) {
      const validMax = Math.max(1, parseInt(maxAttempts, 10) || 20);
      updates.push(
        prisma.systemSetting.upsert({
          where: { key: "loginRateLimit_maxAttempts" },
          update: { value: validMax.toString() },
          create: { key: "loginRateLimit_maxAttempts", value: validMax.toString() },
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: "Rate limiting configuration updated",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update rate limit settings" }, { status: 500 });
  }
}
