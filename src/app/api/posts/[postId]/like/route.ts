import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/server/auth";
import { HttpError, toggleLike } from "@/lib/server/social-store";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await context.params;
    const user = await requireUser(request);
    await toggleLike(user, postId, true);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }

    return NextResponse.json({ detail: "Unable to like post." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await context.params;
    const user = await requireUser(request);
    await toggleLike(user, postId, false);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }

    return NextResponse.json({ detail: "Unable to unlike post." }, { status: 500 });
  }
}
