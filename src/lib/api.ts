import type {
  Comment,
  CommentPayload,
  EntityId,
  Post,
  PostPayload,
  UpdateCommentPayload,
  UpdatePostPayload,
} from "@/types/post";
import { getAuthToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/posts";

function getUrl(path = "") {
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  return `${base}${path}`;
}

async function readErrorMessage(response: Response) {
  const fallback = `Request failed with status ${response.status}`;
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await response.json()) as Record<string, unknown>;
    if (typeof data.detail === "string") {
      return data.detail;
    }

    const firstValue = Object.values(data)[0];
    if (typeof firstValue === "string") {
      return firstValue;
    }

    if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
      return firstValue[0];
    }
  }

  const text = await response.text();
  return text || fallback;
}

async function request<T>(path = "", init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const token = getAuthToken();

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(getUrl(path), {
    ...init,
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function listPosts() {
  return request<Post[]>("");
}

export function createPost(payload: PostPayload) {
  return request<Post>("", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePost(postId: EntityId, payload: UpdatePostPayload) {
  return request<Post>(`${postId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deletePost(postId: EntityId) {
  return request<void>(`${postId}/`, {
    method: "DELETE",
  });
}

export function togglePostLike(postId: EntityId, isLiked: boolean, clientId: string) {
  return request<void>(`${postId}/like/`, {
    method: isLiked ? "DELETE" : "POST",
    headers: {
      "X-Client-Id": clientId,
    },
  });
}

export function listComments(postId: EntityId) {
  return request<Comment[]>(`${postId}/comments/`);
}

export function createComment(postId: EntityId, payload: CommentPayload) {
  return request<Comment>(`${postId}/comments/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateComment(
  postId: EntityId,
  commentId: EntityId,
  payload: UpdateCommentPayload,
) {
  return request<Comment>(`${postId}/comments/${commentId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteComment(postId: EntityId, commentId: EntityId) {
  return request<void>(`${postId}/comments/${commentId}/`, {
    method: "DELETE",
  });
}
