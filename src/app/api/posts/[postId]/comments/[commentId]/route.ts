import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/server/auth";
import { deleteComment, HttpError, updateComment } from "@/lib/server/social-store";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ postId: string; commentId: string }> },
) {
  try {
    const { postId, commentId } = await context.params;
    const user = await requireUser(request);
    const body = (await request.json()) as { text?: string };

    if (!body.text?.trim()) {
      throw new HttpError(400, "Comment text is required.");
    }

    const comment = await updateComment(user, postId, commentId, body.text);
    return NextResponse.json(comment);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }

    return NextResponse.json({ detail: "Unable to update comment." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ postId: string; commentId: string }> },
) {
  try {
    const { postId, commentId } = await context.params;
    const user = await requireUser(request);
    await deleteComment(user, postId, commentId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }

    return NextResponse.json({ detail: "Unable to delete comment." }, { status: 500 });
  }
}
