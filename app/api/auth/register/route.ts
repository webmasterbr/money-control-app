import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { attachAuthCookieToResponse, hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return NextResponse.json(
        { error: "E-mail já registrado" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        firstName,
        lastName
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    const response = NextResponse.json({ user }, { status: 201 });
    attachAuthCookieToResponse(response, user);

    return response;
  } catch (error) {
    console.error("[REGISTER_POST]", error);
    return NextResponse.json(
      { error: "Erro ao registrar usuário" },
      { status: 500 }
    );
  }
}

