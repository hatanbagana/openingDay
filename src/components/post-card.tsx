"use client";

import { useState } from "react";

import { formatTimestamp, getInitials } from "@/lib/format";
import type { Comment, EntityId, Post, UpdatePostPayload } from "@/types/post";

import { CommentSection } from "./comment-section";
import { PostForm } from "./post-form";

interface PostCardProps {
  currentUsername?: string;
  isDeleting: boolean;
  isLikePending: boolean;
  onCommentCountChange: (postId: EntityId, count: number) => void;
  onCommentsChange: (postId: EntityId, comments: Comment[]) => void;
  onDelete: (postId: EntityId) => Promise<void>;
  onLikeToggle: (post: Post) => Promise<void>;
  onUpdate: (postId: EntityId, payload: UpdatePostPayload) => Promise<void>;
  post: Post;
}

export function PostCard({
  currentUsername,
  isDeleting,
  isLikePending,
  onCommentCountChange,
  onCommentsChange,
  onDelete,
  onLikeToggle,
  onUpdate,
  post,
}: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share");

  const initials = getInitials(post.author);
  const canManagePost = currentUsername === post.author;

  async function handleDelete() {
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) {
      return;
    }

    await onDelete(post.id);
  }

  async function handleUpdate(payload: UpdatePostPayload) {
    setIsUpdating(true);

    try {
      await onUpdate(post.id, payload);
      setIsEditing(false);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleShare() {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/?post=${encodeURIComponent(String(post.id))}`
        : String(post.id);

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareLabel("Copied");
      window.setTimeout(() => setShareLabel("Share"), 1600);
    } catch {
      setShareLabel("Failed");
      window.setTimeout(() => setShareLabel("Share"), 1600);
    }
  }

  return (
    <>
      <article className="feedCard">
        <header className="feedCard__header">
          <div className="feedCard__meta">
            <div className="avatar">{initials}</div>
            <div>
              <p className="feedCard__author">{post.author}</p>
              <p className="feedCard__timestamp">{formatTimestamp(post.created_at)}</p>
            </div>
          </div>

          {canManagePost ? (
            <div className="feedCard__actions">
              <button className="pill" type="button" onClick={() => setIsEditing(true)}>
                Edit
              </button>
              <button
                className="pill pill--danger"
                disabled={isDeleting}
                type="button"
                onClick={handleDelete}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          ) : null}
        </header>

        {post.image_url && !imageFailed ? (
          <div className="imageFrame">
            <img
              alt={post.title}
              src={post.image_url}
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <div className="imageFallback">
            <strong>{post.title}</strong>
          </div>
        )}

        <div className="feedCard__body">
          <p className="feedCard__dateLabel">{formatTimestamp(post.created_at)}</p>
        </div>

        <footer className="feedCard__footer">
          <div className="socialBar">
            <button
              aria-label={post.is_liked ? "Unlike post" : "Like post"}
              aria-pressed={post.is_liked}
              className={`socialAction ${post.is_liked ? "socialAction--active" : ""}`}
              disabled={isLikePending}
              type="button"
              onClick={() => onLikeToggle(post)}
            >
              <HeartIcon filled={post.is_liked} />
              <span>{post.likes}</span>
            </button>
            <button
              aria-expanded={isCommentsOpen}
              aria-label="Toggle comments"
              className={`socialAction ${isCommentsOpen ? "socialAction--active" : ""}`}
              type="button"
              onClick={() => setIsCommentsOpen((current) => !current)}
            >
              <CommentIcon />
              <span>{post.comments_count}</span>
            </button>
            <button
              aria-label="Share post"
              className="socialAction"
              type="button"
              onClick={() => void handleShare()}
            >
              <ShareIcon />
              <span>{shareLabel}</span>
            </button>
          </div>

          {isCommentsOpen ? (
            <CommentSection
              commentsCount={post.comments_count}
              currentUsername={currentUsername}
              initialComments={post.comments}
              onCountChange={(count) => onCommentCountChange(post.id, count)}
              onCommentsChange={(comments) => onCommentsChange(post.id, comments)}
              postId={post.id}
            />
          ) : null}
        </footer>
      </article>

      {isEditing ? (
        <div
          aria-modal="true"
          className="modal"
          role="dialog"
          onClick={() => {
            if (!isUpdating) {
              setIsEditing(false);
            }
          }}
        >
          <div className="modalCard" onClick={(event) => event.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <h3>Edit post</h3>
                <p className="muted">Title, caption, image URL update хийнэ.</p>
              </div>
              <button className="pill" type="button" onClick={() => setIsEditing(false)}>
                Close
              </button>
            </div>

            <PostForm
              initialValues={{
                title: post.title,
                caption: post.caption ?? post.content ?? "",
                image_url: post.image_url ?? "",
              }}
              mode="edit"
              onCancel={() => setIsEditing(false)}
              onSubmit={handleUpdate}
              submitLabel={isUpdating ? "Saving..." : "Save changes"}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" className="socialIcon" viewBox="0 0 24 24">
      <path
        d="M12 21 3.8 12.7a5.5 5.5 0 0 1 7.8-7.8L12 5.3l.4-.4a5.5 5.5 0 0 1 7.8 7.8Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg aria-hidden="true" className="socialIcon" viewBox="0 0 24 24">
      <path
        d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H8l-5 3V11.5A8.5 8.5 0 0 1 11.5 3h1A8.5 8.5 0 0 1 21 11.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg aria-hidden="true" className="socialIcon" viewBox="0 0 24 24">
      <path
        d="M14 5h5v5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10 14 19 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
