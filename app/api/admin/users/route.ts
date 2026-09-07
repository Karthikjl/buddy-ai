import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        rateLimit: true,
        mustResetPassword: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            chatSessions: true,
            apiKeys: true,
            characters: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const signupSetting = await prisma.systemSetting.findUnique({
      where: { key: "allowPublicSignup" },
    });
    const allowPublicSignup = signupSetting ? signupSetting.value !== "false" : true;

    const rateLimitSetting = await prisma.systemSetting.findUnique({
      where: { key: "globalLoginRateLimit" },
    });
    const globalLoginRateLimit = rateLimitSetting ? parseInt(rateLimitSetting.value, 10) || 5 : 5;

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "ACTIVE").length,
      inactiveUsers: users.filter((u) => u.status === "INACTIVE").length,
      adminCount: users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length,
      allowPublicSignup,
      globalLoginRateLimit,
    };

    return NextResponse.json({ users, stats, currentUserRole: currentUser.role });
  } catch (err: any) {
    console.error("Admin list users error:", err);
    return NextResponse.json({ error: err.message || "Failed to load users" }, { status: 500 });
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

  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      username,
      email,
      password,
      role = "USER",
      status = "ACTIVE",
      rateLimit = 60,
      mustResetPassword = false,
    } = body;

    if (!email || !password || !username) {
      return NextResponse.json({ error: "Email, username, and password are required" }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_.-]/g, "");
    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters and contain only letters, numbers, or underscores/dashes" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Super Admin accounts cannot be created via admin provisioning. Only the 1st initialized user is Super Admin.
    if (role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Cannot create Super Admin accounts. Only User and Admin roles can be created." },
        { status: 400 }
      );
    }

    // Regular admin cannot create Admin accounts
    if (currentUser.role === "ADMIN" && role === "ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admins can create Admin accounts" },
        { status: 403 }
      );
    }

    const assignedRole = role === "ADMIN" ? "ADMIN" : "USER";

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { username: cleanUsername },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
      }
      if (existingUser.username === cleanUsername) {
        return NextResponse.json({ error: "This username is already taken" }, { status: 409 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        username: cleanUsername,
        name: name?.trim() || cleanUsername,
        passwordHash,
        role: assignedRole,
        status,
        rateLimit: Number(rateLimit) >= 0 ? Number(rateLimit) : 60,
        mustResetPassword: !!mustResetPassword,
        preferences: {
          create: {
            theme: "pearl",
            fontStyle: "sans",
            bubbleStyle: "modern",
          },
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        rateLimit: true,
        mustResetPassword: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: newUser, message: "User created successfully" }, { status: 201 });
  } catch (err: any) {
    console.error("Admin create user error:", err);
    return NextResponse.json({ error: err.message || "Failed to create user" }, { status: 500 });
  }
}
