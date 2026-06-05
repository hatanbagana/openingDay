"use client";

import { useEffect, useRef, useState } from "react";

import {
  createComment,
  deleteComment,
  listComments,
  updateComment,
} from "@/lib/api";
import type { Comment, CommentPayload, EntityId } from "@/types/post";

import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

interface CommentSectionProps {
  commentsCount: number;
  currentUsername?: string;
  initialComments?: Comment[] | null;
  onCountChange?: (count: number) => void;
  onCommentsChange?: (comments: Comment[]) => void;
  postId: EntityId;
}

export function CommentSection({
  commentsCount,
  currentUsername,
  initialComments,
  onCountChange,
  onCommentsChange,
  postId,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments ?? []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<EntityId | null>(null);
  const [editText, setEditText] = useState("");
  const countChangeRef = useRef(onCountChange);
  const commentsChangeRef = useRef(onCommentsChange);
  const fallbackCountRef = useRef(initialComments?.length ?? commentsCount);

  useEffect(() => {
    countChangeRef.current = onCountChange;
  }, [onCountChange]);

  useEffect(() => {
    commentsChangeRef.current = onCommentsChange;
  }, [onCommentsChange]);

  useEffect(() => {
    fallbackCountRef.current = initialComments?.length ?? commentsCount;
  }, [commentsCount, initialComments]);

  useEffect(() => {
    let isMounted = true;

    async function loadComments() {
      setIsLoading(true);
      setError(null);

      try {
        const nextComments = await listComments(postId);
        if (!isMounted) {
          return;
        }

        setComments(nextComments);
        countChangeRef.current?.(nextComments.length);
        commentsChangeRef.current?.(nextComments);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : "Unable to load comments.";

        setError(message);
        countChangeRef.current?.(fallbackCountRef.current);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      isMounted = false;
    };
  }, [postId]);

  async function handleCreate(values: CommentPayload) {
    setIsBusy(true);
    setError(null);

    try {
      const createdComment = await createComment(postId, values);
      setComments((current) => {
        const nextComments = [...current, createdComment];
        countChangeRef.current?.(nextComments.length);
        commentsChangeRef.current?.(nextComments);
        return nextComments;
      });
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : "Unable to add comment.");
      throw creationError;
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete(commentId: EntityId) {
    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await deleteComment(postId, commentId);
      setComments((current) => {
        const nextComments = current.filter((comment) => comment.id !== commentId);
        countChangeRef.current?.(nextComments.length);
        commentsChangeRef.current?.(nextComments);
        return nextComments;
      });

      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditText("");
      }
    } catch (deletionError) {
      setError(deletionError instanceof Error ? deletionError.message : "Unable to delete comment.");
    } finally {
      setIsBusy(false);
    }
  }

  function handleEditStart(comment: Comment) {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  }

  function handleEditCancel() {
    setEditingCommentId(null);
    setEditText("");
  }

  async function handleEditSubmit(commentId: EntityId) {
    if (!editText.trim()) {
      setError("Edited comment text is required.");
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const updated = await updateComment(postId, commentId, {
        text: editText.trim(),
      });

      setComments((current) => {
        const nextComments = current.map((comment) =>
          comment.id === commentId ? updated : comment,
        );
        commentsChangeRef.current?.(nextComments);
        return nextComments;
      });
      setEditingCommentId(null);
      setEditText("");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update comment.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="commentBlock">
      <div className="commentBlock__header">
        <h3 className="commentBlock__title">Comments</h3>
        <span className="muted">{comments.length || commentsCount} total</span>
      </div>

      {error ? <div className="message message--error">{error}</div> : null}

      {isLoading ? (
        <div className="statusCard">Loading comments...</div>
      ) : (
        <CommentList
          comments={comments}
          currentUsername={currentUsername}
          editingCommentId={editingCommentId}
          editText={editText}
          isBusy={isBusy}
          onDelete={handleDelete}
          onEditCancel={handleEditCancel}
          onEditStart={handleEditStart}
          onEditSubmit={handleEditSubmit}
          onEditTextChange={setEditText}
        />
      )}

      <CommentForm
        idPrefix={`post-${postId}`}
        lockedAuthor={currentUsername}
        onSubmit={handleCreate}
      />
    </section>
  );
}
