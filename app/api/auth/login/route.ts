import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { attachAuthCookieToResponse, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const userWithPassword = await prisma.user.findUnique({
      where: { email }
    });

    if (!userWithPassword) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(
      password,
      userWithPassword.password
    );

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const user = {
      id: userWithPassword.id,
      email: userWithPassword.email,
      createdAt: userWithPassword.createdAt
    };

    const response = NextResponse.json({ user });
    attachAuthCookieToResponse(response, user);

    return response;
  } catch (error) {
    console.error("[LOGIN_POST]", error);
    return NextResponse.json(
      { error: "Erro ao autenticar usuário" },
      { status: 500 }
    );
  }
}

