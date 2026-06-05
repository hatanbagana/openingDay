"use client";

import { useState } from "react";

import type { CommentPayload } from "@/types/post";

interface CommentFormProps {
  idPrefix: string;
  lockedAuthor?: string;
  onSubmit: (values: CommentPayload) => Promise<void>;
}

export function CommentForm({ idPrefix, lockedAuthor, onSubmit }: CommentFormProps) {
  const [author, setAuthor] = useState(lockedAuthor ?? "");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nextAuthor = lockedAuthor?.trim() || author.trim();

    if (!nextAuthor) {
      setError("Comment author is required.");
      return;
    }

    if (!text.trim()) {
      setError("Comment text is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        author: nextAuthor,
        text: text.trim(),
      });
      setAuthor(lockedAuthor ?? "");
      setText("");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create comment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="formGrid" onSubmit={handleSubmit}>
      {lockedAuthor ? (
        <div className="statusCard authMeta">
          <strong>Commenting as @{lockedAuthor}</strong>
        </div>
      ) : (
        <div className="field">
          <label htmlFor={`${idPrefix}-comment-author`}>Author</label>
          <input
            id={`${idPrefix}-comment-author`}
            placeholder="temka"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
          />
        </div>
      )}

      <div className="field">
        <label htmlFor={`${idPrefix}-comment-text`}>Comment</label>
        <textarea
          id={`${idPrefix}-comment-text`}
          placeholder="Nice post bro!"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>

      {error ? <div className="message message--error">{error}</div> : null}

      <div className="formRow">
        <button className="pill pill--brand" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Posting..." : "Add comment"}
        </button>
      </div>
    </form>
  );
}
