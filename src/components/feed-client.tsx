"use client";

import { useEffect, useState } from "react";

import {
  createPost,
  deletePost,
  listPosts,
  togglePostLike,
  updatePost,
} from "@/lib/api";
import {
  clearStoredSession,
  getCurrentUser,
  login,
  readStoredSession,
  storeSession,
} from "@/lib/auth";
import { getClientId } from "@/lib/client-id";
import { DEMO_USERNAMES } from "@/lib/demo-users";
import type { AuthSession, LoginPayload } from "@/types/auth";
import type { Comment, EntityId, Post, PostPayload, UpdatePostPayload } from "@/types/post";

import { LoginForm } from "./login-form";
import { PostCard } from "./post-card";
import { PostForm } from "./post-form";

export function FeedClient() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedNotice, setFeedNotice] = useState<string | null>(
    "Local backend is running inside this Next.js app.",
  );
  const [isComposerBusy, setIsComposerBusy] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [likePendingIds, setLikePendingIds] = useState<Set<EntityId>>(new Set());
  const [deletePendingIds, setDeletePendingIds] = useState<Set<EntityId>>(new Set());

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedSession = readStoredSession();
      if (!storedSession) {
        if (isMounted) {
          setIsSessionReady(true);
        }
        return;
      }

      try {
        const user = await getCurrentUser(storedSession.token);
        if (!isMounted) {
          return;
        }

        const nextSession = {
          ...storedSession,
          user,
        };
        storeSession(nextSession);
        setSession(nextSession);
      } catch {
        clearStoredSession();
        if (isMounted) {
          setAuthError("Session expired. Please log in again.");
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsSessionReady(true);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    let isMounted = true;

    async function loadPosts() {
      setIsLoading(true);
      setError(null);

      try {
        const nextPosts = await listPosts();
        if (!isMounted) {
          return;
        }

        setPosts(nextPosts);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        if (loadError instanceof Error && loadError.message === "Authentication required.") {
          clearStoredSession();
          setSession(null);
          setAuthError("Please log in again.");
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load posts.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      isMounted = false;
    };
  }, [session]);

  async function handleLogin(payload: LoginPayload) {
    setAuthError(null);
    const nextSession = await login(payload);
    setSession(nextSession);
    setFeedNotice(`Logged in as @${nextSession.user.username}. Local API is active.`);
    return nextSession;
  }

  function handleLogout() {
    clearStoredSession();
    setSession(null);
    setPosts([]);
    setAuthError(null);
    setError(null);
    setIsCreateModalOpen(false);
  }

  async function handleCreate(createPayload: PostPayload) {
    setIsComposerBusy(true);
    setError(null);

    try {
      const createdPost = await createPost(createPayload);
      setPosts((current) => [createdPost, ...current]);
      setIsCreateModalOpen(false);
    } catch (creationError) {
      const message =
        creationError instanceof Error ? creationError.message : "Unable to create post.";

      setError(message);
      throw creationError;
    } finally {
      setIsComposerBusy(false);
    }
  }

  async function handleUpdate(postId: EntityId, payload: UpdatePostPayload) {
    const updatedPost = await updatePost(postId, payload);

    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, ...updatedPost } : post)),
    );
  }

  async function handleDelete(postId: EntityId) {
    setDeletePendingIds((current) => new Set(current).add(postId));
    setError(null);

    try {
      await deletePost(postId);
      setPosts((current) => current.filter((post) => post.id !== postId));
    } catch (deletionError) {
      setError(deletionError instanceof Error ? deletionError.message : "Unable to delete post.");
    } finally {
      setDeletePendingIds((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
    }
  }

  async function handleLikeToggle(post: Post) {
    const clientId = getClientId();
    const nextIsLiked = !post.is_liked;
    const nextLikes = Math.max(0, post.likes + (nextIsLiked ? 1 : -1));

    setLikePendingIds((current) => new Set(current).add(post.id));
    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              is_liked: nextIsLiked,
              likes: nextLikes,
            }
          : item,
      ),
    );

    try {
      await togglePostLike(post.id, post.is_liked, clientId);
    } catch (likeError) {
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id
            ? {
                ...item,
                is_liked: post.is_liked,
                likes: post.likes,
              }
            : item,
        ),
      );
      setError(likeError instanceof Error ? likeError.message : "Unable to update like.");
    } finally {
      setLikePendingIds((current) => {
        const next = new Set(current);
        next.delete(post.id);
        return next;
      });
    }
  }

  function handleCommentCountChange(postId: EntityId, count: number) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId && post.comments_count !== count
          ? { ...post, comments_count: count }
          : post,
      ),
    );
  }

  function handleCommentsChange(postId: EntityId, comments: Comment[]) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments,
              comments_count: comments.length,
            }
          : post,
      ),
    );
  }

  if (!isSessionReady) {
    return (
      <main className="shell">
        <div className="statusCard">Checking local session...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="shell authShell">
        <section className="hero">
          <div className="hero__intro">
            <p className="eyebrow">Opening Day Local</p>
            <h1 className="hero__title">Login to the local feed.</h1>
            <p className="hero__text">
              Frontend болон backend хоёул `npm run dev` дээр хамт ажиллана. Login хийсний дараа
              post, like, comment CRUD бүгд local file store дээр хадгалагдана.
            </p>
            <div className="hero__stats">
              <div className="hero__stat">
                <strong>Next.js</strong>
                <span>frontend + API routes</span>
              </div>
              <div className="hero__stat">
                <strong>.data</strong>
                <span>local JSON persistence</span>
              </div>
            </div>
          </div>

          <aside className="hero__composer">
            <p className="sectionLabel">Login</p>
            {authError ? <div className="message message--error">{authError}</div> : null}
            <LoginForm demoUsers={DEMO_USERNAMES.slice(0, 5)} onSubmit={handleLogin} />
          </aside>
        </section>
      </main>
    );
  }

  const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero__intro">
          <div className="topbar">
            <p className="eyebrow">Opening Day Local</p>
            <button className="pill" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
          <h1 className="hero__title">Feed your frame.</h1>
          <p className="hero__text">
            Logged in as <strong>@{session.user.username}</strong>. Local backend store нь энэ
            app-ийн `/api` route-ууд дээр ажиллаж байна.
          </p>

          <div className="hero__stats">
            <div className="hero__stat">
              <strong>{posts.length}</strong>
              <span>posts in feed</span>
            </div>
            <div className="hero__stat">
              <strong>{totalLikes}</strong>
              <span>total likes shown</span>
            </div>
            <div className="hero__stat">
              <strong>@{session.user.username}</strong>
              <span>active local session</span>
            </div>
          </div>
        </div>

        <aside className="hero__composer">
          <p className="sectionLabel">Create New Post</p>
          <p className="hero__text" style={{ marginTop: 0, marginBottom: 18 }}>
            Post үүсгэхдээ author автоматаар таны login session-с авна.
          </p>
          <button className="pill pill--brand" type="button" onClick={() => setIsCreateModalOpen(true)}>
            Create post
          </button>
        </aside>
      </section>

      <section className="feedList">
        {feedNotice ? <div className="message message--success">{feedNotice}</div> : null}
        {error ? <div className="message message--error">{error}</div> : null}

        {isLoading ? <div className="statusCard">Loading local feed...</div> : null}

        {!isLoading && !error && posts.length === 0 ? (
          <div className="statusCard">No posts found. Use the Create post button to add one.</div>
        ) : null}

        {posts.map((post) => (
          <PostCard
            currentUsername={session.user.username}
            isDeleting={deletePendingIds.has(post.id)}
            isLikePending={likePendingIds.has(post.id)}
            key={post.id}
            onCommentCountChange={handleCommentCountChange}
            onCommentsChange={handleCommentsChange}
            onDelete={handleDelete}
            onLikeToggle={handleLikeToggle}
            onUpdate={handleUpdate}
            post={post}
          />
        ))}
      </section>

      {isCreateModalOpen ? (
        <div
          aria-modal="true"
          className="modal"
          role="dialog"
          onClick={() => {
            if (!isComposerBusy) {
              setIsCreateModalOpen(false);
            }
          }}
        >
          <div className="modalCard" onClick={(event) => event.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <h3>Create post</h3>
                <p className="muted">Title, caption, image URL оруулаад local post үүсгэнэ.</p>
              </div>
              <button className="pill" type="button" onClick={() => setIsCreateModalOpen(false)}>
                Close
              </button>
            </div>

            <PostForm
              lockedAuthor={session.user.username}
              mode="create"
              onSubmit={handleCreate}
              submitLabel={isComposerBusy ? "Posting..." : "Share post"}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
