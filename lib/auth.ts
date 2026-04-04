import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "moneycontrol_session";

type JwtUserPayload = {
  userId: string;
  email: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado. Defina no arquivo .env");
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signUserJwt(payload: JwtUserPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyUserJwt(token: string): JwtUserPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtUserPayload;
  } catch {
    return null;
  }
}

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
};

/** Valida JWT da sessão; não acessa o banco. */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifyUserJwt(token)?.userId ?? null;
}

export async function getUserProfile(userId: string): Promise<CurrentUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true
    }
  });

  return user as CurrentUser | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = await getSessionUserId();
  if (!userId) {
    return null;
  }
  return getUserProfile(userId);
}

export function attachAuthCookieToResponse(
  response: NextResponse,
  user: { id: string; email: string }
) {
  const token = signUserJwt({ userId: user.id, email: user.email });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 // 7 dias
  });
}

export function clearAuthCookieFromResponse(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

