"use client";

import { useState } from "react";

import { DEMO_PASSWORD } from "@/lib/demo-users";
import type { AuthSession, LoginPayload } from "@/types/auth";

interface LoginFormProps {
  demoUsers: string[];
  onSubmit: (payload: LoginPayload) => Promise<AuthSession>;
}

export function LoginForm({ demoUsers, onSubmit }: LoginFormProps) {
  const [values, setValues] = useState<LoginPayload>({
    username: demoUsers[0] ?? "puujee",
    password: "demo123",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!values.username.trim() || !values.password.trim()) {
      setError("Username and password are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        username: values.username.trim(),
        password: values.password.trim(),
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to log in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="formGrid" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="login-username">Username</label>
        <input
          id="login-username"
          value={values.username}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              username: event.target.value,
            }))
          }
        />
      </div>

      <div className="field">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={values.password}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
        />
      </div>

      <div className="statusCard authMeta">
        <strong>Demo password: {DEMO_PASSWORD}</strong>
        <span>Users: {demoUsers.join(", ")}</span>
      </div>

      {error ? <div className="message message--error">{error}</div> : null}

      <div className="formRow">
        <button className="pill pill--brand" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </div>
    </form>
  );
}
