import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE = "spendy_session";
const SESSION_EXPIRY_DAYS = 7;

interface SessionData {
  userId: string;
  email: string;
}

/**
 * Create a session for a user and set the cookie.
 */
export async function createSession(userId: string, email: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, JSON.stringify({ userId, email }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_EXPIRY_DAYS, // 7 days
  });
}

/**
 * Get the current session from the cookie.
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value) as SessionData;
  } catch {
    return null;
  }
}

/**
 * Get the current user from the session.
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Destroy the current session.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
