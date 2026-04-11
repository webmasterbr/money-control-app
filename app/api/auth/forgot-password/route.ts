import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import {
  createPasswordResetTokenValue,
  getPasswordResetExpiresAt
} from "@/lib/passwordResetToken";
import { forgotPasswordSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { email: true }
    });

    if (user) {
      const token = createPasswordResetTokenValue();
      const expiresAt = getPasswordResetExpiresAt();

      await prisma.passwordResetToken.deleteMany({ where: { email } });
      await prisma.passwordResetToken.create({
        data: { email, token, expiresAt }
      });

      try {
        await sendPasswordResetEmail(email, token);
      } catch (err) {
        const detail =
          err instanceof Error ? err.message : "erro desconhecido";
        console.error(
          "[FORGOT_PASSWORD_POST] Falha ao enviar e-mail de reset:",
          detail
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FORGOT_PASSWORD_POST]", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
