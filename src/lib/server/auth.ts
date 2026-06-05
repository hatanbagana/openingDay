import type { NextRequest } from "next/server";

import { HttpError, findUserByToken } from "./social-store";

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

export async function getOptionalUser(request: NextRequest) {
  return findUserByToken(getBearerToken(request));
}

export async function requireUser(request: NextRequest) {
  const user = await getOptionalUser(request);
  if (!user) {
    throw new HttpError(401, "Authentication required.");
  }

  return user;
}
