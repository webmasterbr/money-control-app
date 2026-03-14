import { NextResponse } from "next/server";
import { clearAuthCookieFromResponse } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearAuthCookieFromResponse(response);
  return response;
}

