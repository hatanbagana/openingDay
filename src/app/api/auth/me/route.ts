import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/social-store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }

    return NextResponse.json({ detail: "Unable to load session." }, { status: 500 });
  }
}
