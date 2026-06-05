import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { DEMO_PASSWORD, DEMO_USERNAMES } from "@/lib/demo-users";
import { createMockPosts } from "@/lib/mock-data";
import type { User } from "@/types/auth";
import type { Comment, Post, PostPayload, UpdatePostPayload } from "@/types/post";

interface DbUser extends User {
  password: string;
}

interface DbComment extends Comment {
  author_id: string;
}

interface DbPost extends Omit<Post, "comments" | "is_liked"> {
  author_id: string;
  comments: DbComment[];
  liked_by: string[];
}

interface DbSession {
  token: string;
  user_id: string;
  created_at: string;
}

interface SocialDb {
  users: DbUser[];
  posts: DbPost[];
  sessions: DbSession[];
}

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "social-db.json");

let writeQueue = Promise.resolve();

function toPublicUser(user: DbUser): User {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
  };
}

function toPublicComment(comment: DbComment): Comment {
  return {
    id: comment.id,
    author: comment.author,
    text: comment.text,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
  };
}

function toPublicPost(post: DbPost, userId?: string): Post {
  return {
    id: post.id,
    author: post.author,
    title: post.title,
    content: post.content,
    caption: post.caption,
    image_url: post.image_url,
    likes: post.likes,
    comments_count: post.comments.length,
    comments: post.comments.map(toPublicComment),
    is_liked: userId ? post.liked_by.includes(userId) : false,
    created_at: post.created_at,
    updated_at: post.updated_at,
  };
}

function ensureUser(users: DbUser[], username: string) {
  const existing = users.find((user) => user.username === username);
  if (existing) {
    return existing;
  }

  const created: DbUser = {
    id: randomUUID(),
    username,
    name: username,
    password: DEMO_PASSWORD,
  };
  users.push(created);
  return created;
}

function createSeedDb(): SocialDb {
  const users = DEMO_USERNAMES.map<DbUser>((username) => ({
    id: randomUUID(),
    username,
    name: username,
    password: DEMO_PASSWORD,
  }));

  const posts = createMockPosts().map<DbPost>((post) => {
    const author = ensureUser(users, post.author);
    return {
      id: String(post.id),
      author: post.author,
      author_id: author.id,
      title: post.title,
      content: post.content ?? post.caption ?? "",
      caption: post.caption ?? post.content ?? "",
      image_url: post.image_url ?? "",
      likes: post.likes,
      comments_count: post.comments?.length ?? post.comments_count,
      comments:
        post.comments?.map((comment) => {
          const commentAuthor = ensureUser(users, comment.author);
          return {
            id: String(comment.id),
            author: comment.author,
            author_id: commentAuthor.id,
            text: comment.text,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
          };
        }) ?? [],
      liked_by: post.is_liked ? [author.id] : [],
      created_at: post.created_at,
      updated_at: post.updated_at,
    };
  });

  return {
    users,
    posts,
    sessions: [],
  };
}

async function ensureDb() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    await writeFile(DATA_FILE, JSON.stringify(createSeedDb(), null, 2), "utf8");
  }
}

async function readDb() {
  await ensureDb();
  const raw = await readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as SocialDb;
}

async function writeDb(db: SocialDb) {
  await writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

async function mutateDb<T>(updater: (db: SocialDb) => Promise<T> | T) {
  let result!: T;

  writeQueue = writeQueue.catch(() => undefined).then(async () => {
    const db = await readDb();
    result = await updater(db);
    await writeDb(db);
  });

  await writeQueue;
  return result;
}

function getPostOrThrow(posts: DbPost[], postId: string) {
  const post = posts.find((item) => String(item.id) === postId);
  if (!post) {
    throw new HttpError(404, "Post not found.");
  }

  return post;
}

export async function authenticateUser(username: string, password: string) {
  return mutateDb((db) => {
    const user = db.users.find(
      (candidate) => candidate.username === username.trim() && candidate.password === password,
    );

    if (!user) {
      throw new HttpError(401, "Invalid username or password.");
    }

    const token = randomUUID();
    db.sessions.push({
      token,
      user_id: user.id,
      created_at: new Date().toISOString(),
    });

    return {
      token,
      user: toPublicUser(user),
    };
  });
}

export async function findUserByToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const db = await readDb();
  const session = db.sessions.find((item) => item.token === token);
  if (!session) {
    return null;
  }

  const user = db.users.find((item) => item.id === session.user_id);
  return user ? toPublicUser(user) : null;
}

export async function listPosts(userId?: string) {
  const db = await readDb();
  return db.posts.map((post) => toPublicPost(post, userId));
}

export async function createPost(user: User, payload: PostPayload) {
  return mutateDb((db) => {
    const now = new Date().toISOString();
    const post: DbPost = {
      id: randomUUID(),
      author: user.username,
      author_id: user.id,
      title: payload.title.trim(),
      content: payload.caption.trim(),
      caption: payload.caption.trim(),
      image_url: payload.image_url.trim(),
      likes: 0,
      comments_count: 0,
      comments: [],
      liked_by: [],
      created_at: now,
      updated_at: now,
    };

    db.posts.unshift(post);
    return toPublicPost(post, user.id);
  });
}

export async function updatePost(user: User, postId: string, payload: UpdatePostPayload) {
  return mutateDb((db) => {
    const post = getPostOrThrow(db.posts, postId);
    if (post.author_id !== user.id) {
      throw new HttpError(403, "You can only edit your own posts.");
    }

    post.title = payload.title.trim();
    post.caption = payload.caption.trim();
    post.content = payload.caption.trim();
    post.image_url = payload.image_url.trim();
    post.updated_at = new Date().toISOString();

    return toPublicPost(post, user.id);
  });
}

export async function deletePost(user: User, postId: string) {
  return mutateDb((db) => {
    const index = db.posts.findIndex((item) => String(item.id) === postId);
    if (index === -1) {
      throw new HttpError(404, "Post not found.");
    }

    if (db.posts[index]?.author_id !== user.id) {
      throw new HttpError(403, "You can only delete your own posts.");
    }

    db.posts.splice(index, 1);
  });
}

export async function toggleLike(user: User, postId: string, shouldLike: boolean) {
  return mutateDb((db) => {
    const post = getPostOrThrow(db.posts, postId);
    const isLiked = post.liked_by.includes(user.id);

    if (shouldLike && !isLiked) {
      post.liked_by.push(user.id);
      post.likes += 1;
    }

    if (!shouldLike && isLiked) {
      post.liked_by = post.liked_by.filter((item) => item !== user.id);
      post.likes = Math.max(0, post.likes - 1);
    }

    post.updated_at = new Date().toISOString();
    return toPublicPost(post, user.id);
  });
}

export async function listComments(postId: string) {
  const db = await readDb();
  const post = getPostOrThrow(db.posts, postId);
  return post.comments.map(toPublicComment);
}

export async function createComment(user: User, postId: string, text: string) {
  return mutateDb((db) => {
    const post = getPostOrThrow(db.posts, postId);
    const now = new Date().toISOString();
    const comment: DbComment = {
      id: randomUUID(),
      author: user.username,
      author_id: user.id,
      text: text.trim(),
      created_at: now,
      updated_at: now,
    };

    post.comments.push(comment);
    post.comments_count = post.comments.length;
    post.updated_at = now;
    return toPublicComment(comment);
  });
}

export async function updateComment(user: User, postId: string, commentId: string, text: string) {
  return mutateDb((db) => {
    const post = getPostOrThrow(db.posts, postId);
    const comment = post.comments.find((item) => String(item.id) === commentId);
    if (!comment) {
      throw new HttpError(404, "Comment not found.");
    }

    if (comment.author_id !== user.id) {
      throw new HttpError(403, "You can only edit your own comments.");
    }

    comment.text = text.trim();
    comment.updated_at = new Date().toISOString();
    post.updated_at = comment.updated_at;
    return toPublicComment(comment);
  });
}

export async function deleteComment(user: User, postId: string, commentId: string) {
  return mutateDb((db) => {
    const post = getPostOrThrow(db.posts, postId);
    const comment = post.comments.find((item) => String(item.id) === commentId);
    if (!comment) {
      throw new HttpError(404, "Comment not found.");
    }

    if (comment.author_id !== user.id) {
      throw new HttpError(403, "You can only delete your own comments.");
    }

    post.comments = post.comments.filter((item) => String(item.id) !== commentId);
    post.comments_count = post.comments.length;
    post.updated_at = new Date().toISOString();
  });
}
