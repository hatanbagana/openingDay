import { NextRequest, NextResponse } from "next/server";

import { getOptionalUser, requireUser } from "@/lib/server/auth";
import { createPost, HttpError, listPosts } from "@/lib/server/social-store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await getOptionalUser(request);
    const posts = await listPosts(user?.id);
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json({ detail: "Unable to load posts." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as {
      author?: string;
      title?: string;
      caption?: string;
      image_url?: string;
    };

    if (!body.title?.trim() || !body.caption?.trim() || !body.image_url?.trim()) {
      throw new HttpError(400, "Title, caption, and image URL are required.");
    }

    const post = await createPost(user, {
      author: user.username,
      title: body.title,
      caption: body.caption,
      image_url: body.image_url,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }

    return NextResponse.json({ detail: "Unable to create post." }, { status: 500 });
  }
}
