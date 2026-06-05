import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/server/auth";
import { deletePost, HttpError, updatePost } from "@/lib/server/social-store";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await context.params;
    const user = await requireUser(request);
    const body = (await request.json()) as {
      title?: string;
      caption?: string;
      image_url?: string;
    };

    if (!body.title?.trim() || !body.caption?.trim() || !body.image_url?.trim()) {
      throw new HttpError(400, "Title, caption, and image URL are required.");
    }

    const post = await updatePost(user, postId, {
      title: body.title,
      caption: body.caption,
      image_url: body.image_url,
    });

    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }

    return NextResponse.json({ detail: "Unable to update post." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await context.params;
    const user = await requireUser(request);
    await deletePost(user, postId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }

    return NextResponse.json({ detail: "Unable to delete post." }, { status: 500 });
  }
}
