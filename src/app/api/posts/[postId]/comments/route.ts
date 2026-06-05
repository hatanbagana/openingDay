import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/server/auth";
import { createComment, HttpError, listComments } from "@/lib/server/social-store";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await context.params;
    const comments = await listComments(postId);
    return NextResponse.json(comments);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }

    return NextResponse.json({ detail: "Unable to load comments." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await context.params;
    const user = await requireUser(request);
    const body = (await request.json()) as { author?: string; text?: string };

    if (!body.text?.trim()) {
      throw new HttpError(400, "Comment text is required.");
    }

    const comment = await createComment(user, postId, body.text);
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }

    return NextResponse.json({ detail: "Unable to create comment." }, { status: 500 });
  }
}
