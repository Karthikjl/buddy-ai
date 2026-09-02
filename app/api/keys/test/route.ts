import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { testLLMConnection } from "@/lib/llm/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { baseUrl, apiKey, model } = await req.json();

    if (!baseUrl || !model) {
      return NextResponse.json(
        { error: "Base URL and Model are required" },
        { status: 400 }
      );
    }

    const result = await testLLMConnection({
      baseUrl,
      apiKey: apiKey || "",
      model,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Connection successful!" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to test connection" },
      { status: 500 }
    );
  }
}
