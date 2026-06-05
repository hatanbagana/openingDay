import { NextRequest, NextResponse } from "next/server";

import { authenticateUser, HttpError } from "@/lib/server/social-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = body.username?.trim();
    const password = body.password?.trim();

    if (!username || !password) {
      throw new HttpError(400, "Username and password are required.");
    }

    const session = await authenticateUser(username, password);
    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }

    return NextResponse.json({ detail: "Unable to log in." }, { status: 500 });
  }
}
