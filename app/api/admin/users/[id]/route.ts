import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  const targetUserId = params.id;
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "Target user not found" }, { status: 404 });
  }

  // A regular ADMIN cannot modify a SUPER_ADMIN or change someone into a SUPER_ADMIN
  if (currentUser.role === "ADMIN" && targetUser.role === "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Regular admins cannot modify Super Admin accounts" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      name,
      username,
      email,
      role,
      status,
      rateLimit,
      mustResetPassword,
      password,
    } = body;

    const dataToUpdate: any = {};

    if (name !== undefined) dataToUpdate.name = name?.trim();
    if (username !== undefined) {
      const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_.-]/g, "");
      if (cleanUsername.length < 3) {
        return NextResponse.json(
          { error: "Username must be at least 3 characters" },
          { status: 400 }
        );
      }
      const existing = await prisma.user.findFirst({
        where: { username: cleanUsername, NOT: { id: targetUserId } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "This username is already in use by another account" },
          { status: 409 }
        );
      }
      dataToUpdate.username = cleanUsername;
    }
    if (email !== undefined) {
      const cleanEmail = email.toLowerCase().trim();
      const existing = await prisma.user.findFirst({
        where: { email: cleanEmail, NOT: { id: targetUserId } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "This email is already in use by another account" },
          { status: 409 }
        );
      }
      dataToUpdate.email = cleanEmail;
    }

    if (role !== undefined) {
      if (role === "SUPER_ADMIN" && targetUser.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Cannot promote accounts to Super Admin. Only User and Admin roles can be assigned." },
          { status: 400 }
        );
      }

      if (targetUser.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "The Super Admin role cannot be modified." },
          { status: 400 }
        );
      }

      if (currentUser.role === "ADMIN" && role === "ADMIN") {
        return NextResponse.json(
          { error: "Only Super Admins can assign Admin roles" },
          { status: 403 }
        );
      }

      dataToUpdate.role = role === "ADMIN" ? "ADMIN" : "USER";
    }

    if (status !== undefined) {
      // Prevent deactivating oneself
      if (targetUser.id === currentUser.id && status === "INACTIVE") {
        return NextResponse.json(
          { error: "You cannot deactivate your own account" },
          { status: 400 }
        );
      }

      // Prevent deactivating the last active SUPER_ADMIN
      if (targetUser.role === "SUPER_ADMIN" && status === "INACTIVE") {
        const superAdminCount = await prisma.user.count({
          where: { role: "SUPER_ADMIN", status: "ACTIVE" },
        });
        if (superAdminCount <= 1) {
          return NextResponse.json(
            { error: "Cannot deactivate the last active Super Admin" },
            { status: 400 }
          );
        }
      }
      dataToUpdate.status = status;
    }

    if (rateLimit !== undefined) {
      dataToUpdate.rateLimit = Math.max(0, parseInt(rateLimit, 10) || 0);
    }

    if (mustResetPassword !== undefined) {
      dataToUpdate.mustResetPassword = !!mustResetPassword;
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long" },
          { status: 400 }
        );
      }
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        rateLimit: true,
        mustResetPassword: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      user: updated,
      message: "User updated successfully",
    });
  } catch (err: any) {
    console.error("Admin update user error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  const targetUserId = params.id;

  // Prevent deleting own account
  if (targetUserId === currentUser.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account from the admin panel" },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "Target user not found" }, { status: 404 });
  }

  // Regular admin cannot delete a Super Admin
  if (currentUser.role === "ADMIN" && targetUser.role === "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Regular admins cannot delete Super Admin accounts" },
      { status: 403 }
    );
  }

  // Cannot delete last Super Admin
  if (targetUser.role === "SUPER_ADMIN") {
    const superAdminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });
    if (superAdminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last Super Admin" },
        { status: 400 }
      );
    }
  }

  try {
    await prisma.user.delete({
      where: { id: targetUserId },
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} deleted successfully`,
    });
  } catch (err: any) {
    console.error("Admin delete user error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
