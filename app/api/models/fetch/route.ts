import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchProviderModels } from "@/lib/llm/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { baseUrl, apiKey } = await req.json();

    if (!baseUrl) {
      return NextResponse.json(
        { error: "Base URL is required to fetch models" },
        { status: 400 }
      );
    }

    const result = await fetchProviderModels({
      baseUrl,
      apiKey: apiKey || undefined,
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        requiresAuth: !!result.requiresAuth,
        message: result.message || "Failed to fetch models from provider",
        models: [],
      });
    }

    return NextResponse.json({
      success: true,
      requiresAuth: false,
      models: result.models,
      count: result.models.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred while fetching models" },
      { status: 500 }
    );
  }
}
