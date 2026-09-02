import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { encryptApiKey, decryptApiKey, maskApiKey } from "@/lib/crypto";
import { testLLMConnection } from "@/lib/llm/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { apiKeys: { orderBy: { createdAt: "desc" } } },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const safeKeys = user.apiKeys.map((k) => {
    let masked = "••••••••";
    try {
      const decrypted = decryptApiKey({
        encryptedKey: k.encryptedKey,
        iv: k.iv,
        authTag: k.authTag,
      });
      masked = maskApiKey(decrypted);
    } catch {
      masked = "•••••••• (error decrypting)";
    }

    return {
      id: k.id,
      provider: k.provider,
      label: k.label || k.provider,
      baseUrl: k.baseUrl,
      maskedKey: masked,
      model: k.model,
      isActive: k.isActive,
      createdAt: k.createdAt,
    };
  });

  return NextResponse.json({ keys: safeKeys });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const { provider, label, baseUrl, apiKey, model, testBeforeSave } =
      await req.json();

    if (!baseUrl || !apiKey || !model) {
      return NextResponse.json(
        { error: "Base URL, API Key, and Model are required" },
        { status: 400 }
      );
    }

    if (testBeforeSave) {
      const testResult = await testLLMConnection({ baseUrl, apiKey, model });
      if (!testResult.success) {
        return NextResponse.json(
          {
            error: `Connection test failed: ${testResult.message}`,
          },
          { status: 400 }
        );
      }
    }

    const { encryptedKey, iv, authTag } = encryptApiKey(apiKey.trim());

    // Deactivate previous active keys
    await prisma.apiKey.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    const createdKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        provider: provider || "custom",
        label: label || `${provider || "custom"} (${model})`,
        baseUrl: baseUrl.trim(),
        encryptedKey,
        iv,
        authTag,
        model: model.trim(),
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        message: "API key stored and activated securely",
        key: {
          id: createdKey.id,
          provider: createdKey.provider,
          label: createdKey.label,
          baseUrl: createdKey.baseUrl,
          maskedKey: maskApiKey(apiKey.trim()),
          model: createdKey.model,
          isActive: createdKey.isActive,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Save API Key error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save API key" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get("id");

  if (!keyId) {
    return NextResponse.json({ error: "Missing key ID" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.apiKey.deleteMany({
    where: { id: keyId, userId: user.id },
  });

  // If there are other keys, make the latest one active if none is active
  const activeExists = await prisma.apiKey.findFirst({
    where: { userId: user.id, isActive: true },
  });
  if (!activeExists) {
    const latest = await prisma.apiKey.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (latest) {
      await prisma.apiKey.update({
        where: { id: latest.id },
        data: { isActive: true },
      });
    }
  }

  return NextResponse.json({ message: "Key deleted" });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id, makeActive, model } = await req.json();

  if (makeActive) {
    await prisma.apiKey.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });
    await prisma.apiKey.update({
      where: { id, userId: user.id },
      data: { isActive: true, ...(model ? { model } : {}) },
    });
  } else if (model) {
    await prisma.apiKey.update({
      where: { id, userId: user.id },
      data: { model },
    });
  }

  return NextResponse.json({ message: "Updated key configuration" });
}
