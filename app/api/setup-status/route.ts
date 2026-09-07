import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    let allowPublicSignup = true;
    if (!isFirstUser) {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: "allowPublicSignup" },
      });
      if (setting && setting.value === "false") {
        allowPublicSignup = false;
      }
    }

    return NextResponse.json({
      isFirstUser,
      allowPublicSignup,
      userCount,
    });
  } catch (err: any) {
    console.error("Setup status error:", err);
    return NextResponse.json(
      { isFirstUser: false, allowPublicSignup: true, error: err.message },
      { status: 500 }
    );
  }
}
