"use client";

import type { Comment, EntityId } from "@/types/post";
import { formatTimestamp } from "@/lib/format";

interface CommentListProps {
  comments: Comment[];
  currentUsername?: string;
  editingCommentId: EntityId | null;
  editText: string;
  emptyMessage?: string;
  isBusy: boolean;
  onDelete: (commentId: EntityId) => Promise<void>;
  onEditCancel: () => void;
  onEditStart: (comment: Comment) => void;
  onEditSubmit: (commentId: EntityId) => Promise<void>;
  onEditTextChange: (value: string) => void;
}

export function CommentList({
  comments,
  currentUsername,
  editingCommentId,
  editText,
  emptyMessage = "No comments yet. Start the conversation.",
  isBusy,
  onDelete,
  onEditCancel,
  onEditStart,
  onEditSubmit,
  onEditTextChange,
}: CommentListProps) {
  if (comments.length === 0) {
    return <div className="statusCard">{emptyMessage}</div>;
  }

  return (
    <div className="commentList">
      {comments.map((comment) => {
        const isEditing = editingCommentId === comment.id;
        const canManage = currentUsername === comment.author;

        return (
          <article className="commentItem" key={comment.id}>
            <div className="commentItem__top">
              <div>
                <p className="commentItem__author">{comment.author}</p>
                <p className="commentItem__time">
                  {formatTimestamp(comment.updated_at ?? comment.created_at)}
                </p>
              </div>

              {canManage ? (
                <div className="feedCard__actions">
                  <button
                    className="pill"
                    disabled={isBusy}
                    type="button"
                    onClick={() => onEditStart(comment)}
                  >
                    Edit
                  </button>
                  <button
                    className="pill pill--danger"
                    disabled={isBusy}
                    type="button"
                    onClick={() => onDelete(comment.id)}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>

            {isEditing ? (
              <form
                className="formGrid"
                onSubmit={(event) => {
                  event.preventDefault();
                  void onEditSubmit(comment.id);
                }}
              >
                <div className="field">
                  <label htmlFor={`comment-edit-${comment.id}`}>Edit comment</label>
                  <textarea
                    id={`comment-edit-${comment.id}`}
                    value={editText}
                    onChange={(event) => onEditTextChange(event.target.value)}
                  />
                </div>
                <div className="formRow">
                  <button className="pill pill--brand" disabled={isBusy} type="submit">
                    Save
                  </button>
                  <button className="pill" disabled={isBusy} type="button" onClick={onEditCancel}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="commentItem__text">{comment.text}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
