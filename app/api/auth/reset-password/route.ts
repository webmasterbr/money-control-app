import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validation";

const INVALID_LINK_MESSAGE = "Link inválido ou expirado.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, newPassword } = parsed.data;

    const row = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    const now = new Date();
    if (!row || row.expiresAt <= now) {
      return NextResponse.json({ error: INVALID_LINK_MESSAGE }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: row.email },
        data: { password: passwordHash }
      }),
      prisma.passwordResetToken.delete({ where: { id: row.id } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RESET_PASSWORD_POST]", error);
    return NextResponse.json(
      { error: "Erro ao redefinir senha" },
      { status: 500 }
    );
  }
}
