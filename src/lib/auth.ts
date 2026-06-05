"use client";

import type { AuthSession, LoginPayload, User } from "@/types/auth";

const SESSION_KEY = "opening_day_session";

function authHeaders(token?: string) {
  const headers = new Headers();
  const sessionToken = token ?? readStoredSession()?.token;
  if (sessionToken) {
    headers.set("Authorization", `Bearer ${sessionToken}`);
  }

  return headers;
}

export function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function storeSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

export function getAuthToken() {
  return readStoredSession()?.token ?? "";
}

async function readJsonError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = (await response.json()) as Record<string, unknown>;
    if (typeof data.detail === "string") {
      return data.detail;
    }
  }

  return (await response.text()) || "Authentication failed.";
}

export async function login(payload: LoginPayload) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readJsonError(response));
  }

  const session = (await response.json()) as AuthSession;
  storeSession(session);
  return session;
}

export async function getCurrentUser(token?: string) {
  const response = await fetch("/api/auth/me", {
    headers: authHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readJsonError(response));
  }

  return (await response.json()) as User;
}
