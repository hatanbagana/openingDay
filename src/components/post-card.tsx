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

  const mainCopy = post.caption || post.content || "No caption yet.";
  const secondaryCopy = post.caption && post.content && post.content !== post.caption ? post.content : "";
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
          <h2 className="feedCard__title">{post.title}</h2>
          <p className="feedCard__caption">{mainCopy}</p>
          {secondaryCopy ? <p className="feedCard__content">{secondaryCopy}</p> : null}
        </div>

        <footer className="feedCard__footer">
          <div className="postStats">
            <button
              className={`pill ${post.is_liked ? "pill--brand" : "pill--soft"}`}
              disabled={isLikePending}
              type="button"
              onClick={() => onLikeToggle(post)}
            >
              {post.is_liked ? "Unlike" : "Like"} · {post.likes}
            </button>
            <div className="pill">Comments · {post.comments_count}</div>
          </div>

          <CommentSection
            commentsCount={post.comments_count}
            currentUsername={currentUsername}
            initialComments={post.comments}
            onCountChange={(count) => onCommentCountChange(post.id, count)}
            onCommentsChange={(comments) => onCommentsChange(post.id, comments)}
            postId={post.id}
          />
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
