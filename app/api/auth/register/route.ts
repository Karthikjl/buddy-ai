import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, username, email, password } = await req.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Email, username, and password are all required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_.-]/g, "");
    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long and contain only letters, numbers, or underscores/dashes" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email or username already taken
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
        return NextResponse.json(
          { error: "An account with this email address already exists" },
          { status: 409 }
        );
      }
      if (existingUser.username === cleanUsername) {
        return NextResponse.json(
          { error: "This username is already taken. Please choose another." },
          { status: 409 }
        );
      }
    }

    const totalUsers = await prisma.user.count();
    const isFirstUser = totalUsers === 0;

    if (!isFirstUser) {
      const signupSetting = await prisma.systemSetting.findUnique({
        where: { key: "allowPublicSignup" },
      });
      if (signupSetting && signupSetting.value === "false") {
        return NextResponse.json(
          { error: "Public registration is currently disabled by administrator. Please contact an admin for an account." },
          { status: 403 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = isFirstUser ? "SUPER_ADMIN" : "USER";
    const assignedRateLimit = isFirstUser ? 0 : 60;

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        username: cleanUsername,
        name: name?.trim() || cleanUsername,
        passwordHash,
        role: assignedRole,
        status: "ACTIVE",
        mustResetPassword: false,
        rateLimit: assignedRateLimit,
        preferences: {
          create: {
            theme: "pearl",
            fontStyle: "sans",
            bubbleStyle: "modern",
          },
        },
      },
    });

    if (isFirstUser) {
      await prisma.systemSetting.upsert({
        where: { key: "allowPublicSignup" },
        update: { value: "true" },
        create: { key: "allowPublicSignup", value: "true" },
      });
    }

    return NextResponse.json(
      {
        message: isFirstUser
          ? "Super Admin account initialized successfully"
          : "Account created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
