import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    return { session: null, response: jsonError("Unauthorized", 401) } as const;
  }

  return { session, response: null } as const;
}

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return { session: null, response: jsonError("Unauthorized", 401) } as const;
  }

  if (session.user.role !== "ADMIN") {
    return { session: null, response: jsonError("Forbidden", 403) } as const;
  }

  return { session, response: null } as const;
}
