"use client";

import { useState } from "react";

import type { PostPayload, UpdatePostPayload } from "@/types/post";

interface BasePostFormProps {
  initialValues?: Partial<PostPayload>;
  lockedAuthor?: string;
  onCancel?: () => void;
  submitLabel?: string;
}

interface CreatePostFormProps extends BasePostFormProps {
  mode: "create";
  onSubmit: (values: PostPayload) => Promise<void>;
}

interface EditPostFormProps extends BasePostFormProps {
  mode: "edit";
  onSubmit: (values: UpdatePostPayload) => Promise<void>;
}

type PostFormProps = CreatePostFormProps | EditPostFormProps;

const EMPTY_FORM: PostPayload = {
  author: "",
  title: "",
  caption: "",
  image_url: "",
};

export function PostForm({
  initialValues,
  lockedAuthor,
  mode,
  onCancel,
  onSubmit,
  submitLabel,
}: PostFormProps) {
  const [values, setValues] = useState<PostPayload>({
    ...EMPTY_FORM,
    author: lockedAuthor ?? EMPTY_FORM.author,
    ...initialValues,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const author = lockedAuthor?.trim() || values.author.trim();

    if (mode === "create" && !author) {
      setError("Author name is required.");
      return;
    }

    if (!values.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!values.caption.trim()) {
      setError("Caption is required.");
      return;
    }

    if (!values.image_url.trim()) {
      setError("Image URL is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await onSubmit({
          author,
          title: values.title.trim(),
          caption: values.caption.trim(),
          image_url: values.image_url.trim(),
        });
        setValues(EMPTY_FORM);
      } else {
        await onSubmit({
          title: values.title.trim(),
          caption: values.caption.trim(),
          image_url: values.image_url.trim(),
        });
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to save post.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<Key extends keyof PostPayload>(key: Key, nextValue: PostPayload[Key]) {
    setValues((current) => ({
      ...current,
      [key]: nextValue,
    }));
  }

  return (
    <form className="formGrid" onSubmit={handleSubmit}>
      {mode === "create" && !lockedAuthor ? (
        <div className="field">
          <label htmlFor={`post-author-${mode}`}>Author</label>
          <input
            id={`post-author-${mode}`}
            name="author"
            placeholder="puujee"
            value={values.author}
            onChange={(event) => updateField("author", event.target.value)}
          />
        </div>
      ) : null}

      {mode === "create" && lockedAuthor ? (
        <div className="statusCard authMeta">
          <strong>Posting as @{lockedAuthor}</strong>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor={`post-title-${mode}`}>Title</label>
        <input
          id={`post-title-${mode}`}
          name="title"
          placeholder="Coffee time"
          value={values.title}
          onChange={(event) => updateField("title", event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor={`post-caption-${mode}`}>Caption</label>
        <textarea
          id={`post-caption-${mode}`}
          name="caption"
          placeholder="Share today's mood..."
          value={values.caption}
          onChange={(event) => updateField("caption", event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor={`post-image-${mode}`}>Image URL</label>
        <input
          id={`post-image-${mode}`}
          name="image_url"
          placeholder="https://example.com/photo.jpg"
          value={values.image_url}
          onChange={(event) => updateField("image_url", event.target.value)}
        />
        <p className="field__hint">Remote image URL paste хийгээд нийтэлнэ.</p>
      </div>

      {error ? <div className="message message--error">{error}</div> : null}

      <div className="formRow">
        <button className="pill pill--brand" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : submitLabel ?? (mode === "create" ? "Share post" : "Save")}
        </button>

        {onCancel ? (
          <button className="pill" disabled={isSubmitting} type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
