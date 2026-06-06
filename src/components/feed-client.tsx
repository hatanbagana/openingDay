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
import type {
  Comment,
  EntityId,
  Post,
  PostPayload,
  UpdatePostPayload,
} from "@/types/post";

import { LoginForm } from "./login-form";
import { PostCard } from "./post-card";
import { PostForm } from "./post-form";

interface Toast {
  id: number;
  message: string;
}

export function FeedClient() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedNotice, setFeedNotice] = useState<string | null>(
    "Local backend is running inside this Next.js app.",
  );
  const [isComposerBusy, setIsComposerBusy] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [likePendingIds, setLikePendingIds] = useState<Set<EntityId>>(
    new Set(),
  );
  const [deletePendingIds, setDeletePendingIds] = useState<Set<EntityId>>(
    new Set(),
  );

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

        if (
          loadError instanceof Error &&
          loadError.message === "Authentication required."
        ) {
          clearStoredSession();
          setSession(null);
          setAuthError("Please log in again.");
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load posts.",
        );
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
    setFeedNotice(
      `Logged in as @${nextSession.user.username}. Local API is active.`,
    );
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

  function pushToast(message: string) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2600);
  }

  async function handleCreate(createPayload: PostPayload) {
    setIsComposerBusy(true);
    setError(null);

    try {
      const createdPost = await createPost(createPayload);
      setPosts((current) => [createdPost, ...current]);
      setIsCreateModalOpen(false);
      pushToast("Post created.");
    } catch (creationError) {
      const message =
        creationError instanceof Error
          ? creationError.message
          : "Unable to create post.";

      setError(message);
      throw creationError;
    } finally {
      setIsComposerBusy(false);
    }
  }

  async function handleUpdate(postId: EntityId, payload: UpdatePostPayload) {
    const updatedPost = await updatePost(postId, payload);

    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, ...updatedPost } : post,
      ),
    );
  }

  async function handleDelete(postId: EntityId) {
    setDeletePendingIds((current) => new Set(current).add(postId));
    setError(null);

    try {
      await deletePost(postId);
      setPosts((current) => current.filter((post) => post.id !== postId));
      pushToast("Post deleted.");
    } catch (deletionError) {
      setError(
        deletionError instanceof Error
          ? deletionError.message
          : "Unable to delete post.",
      );
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
      setError(
        likeError instanceof Error
          ? likeError.message
          : "Unable to update like.",
      );
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
        <section className="authCenter">
          <aside className="hero__composer authCard">
            <p className="sectionLabel">Login</p>
            {authError ? (
              <div className="message message--error">{authError}</div>
            ) : null}
            <LoginForm
              demoUsers={DEMO_USERNAMES.slice(0, 5)}
              onSubmit={handleLogin}
            />
          </aside>
        </section>
      </main>
    );
  }

  const filteredPosts = posts.filter((post) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [post.author, post.title, post.caption ?? "", post.content ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  return (
    <main className="shell">
      <header className="appHeader">
        <label className="searchBar" htmlFor="feed-search">
          <span>Search</span>
          <input
            id="feed-search"
            placeholder="Search posts, caption, author..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        <div className="profileChip">
          <div className="avatar">
            {session.user.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="profileChip__meta">
            <strong>@{session.user.username}</strong>
            <span>{posts.length} posts in your feed</span>
          </div>
          <button className="pill" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="mainStack">
        <section className="createStrip">
          <div className="createStrip__content">
            <div className="createStrip__copy">
              <p className="sectionLabel">Create New Post</p>
              <h2 className="createStrip__title">Drop a fresh frame into the feed.</h2>
              <p className="createStrip__meta">
                Title, caption, image URL оруулаад нийтэлнэ.
              </p>
            </div>
            <button
              className="pill pill--brand createStrip__button"
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create post
            </button>
          </div>
        </section>
      </section>

      <section className="feedList">
        {feedNotice ? (
          <div className="message message--success">{feedNotice}</div>
        ) : null}
        {error ? <div className="message message--error">{error}</div> : null}

        {isLoading ? (
          <div className="statusCard">Loading local feed...</div>
        ) : null}

        {!isLoading && !error && filteredPosts.length === 0 ? (
          <div className="statusCard">
            No posts found. Use the Create post button to add one.
          </div>
        ) : null}

        {filteredPosts.map((post) => (
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
          <div
            className="modalCard"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modalHeader">
              <div>
                <h3>Create post</h3>
                <p className="muted">
                  Title, caption, image URL оруулаад local post үүсгэнэ.
                </p>
              </div>
              <button
                className="pill"
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
              >
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

      {toasts.length > 0 ? (
        <div className="toastStack" aria-live="polite" aria-atomic="true">
          {toasts.map((toast) => (
            <div className="toast" key={toast.id}>
              {toast.message}
            </div>
          ))}
        </div>
      ) : null}
    </main>
  );
}
