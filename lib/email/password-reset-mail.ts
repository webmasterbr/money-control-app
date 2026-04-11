import { sendEmail } from "@/lib/email/email-service";
import { getAppBaseUrl } from "@/lib/passwordResetToken";

const RESET_SUBJECT = "Redefinição de senha — Saldo Certo";

function getPasswordResetMailConfigIssue(): string | null {
  if (!getAppBaseUrl()) {
    return "APP_URL ausente (em produção defina APP_URL ou use deploy na Vercel com VERCEL_URL)";
  }
  if (!process.env.RESEND_API_KEY?.trim()) {
    return "RESEND_API_KEY ausente ou vazio";
  }
  if (!process.env.MAIL_FROM?.trim()) {
    return "MAIL_FROM ausente ou vazio";
  }
  return null;
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const issue = getPasswordResetMailConfigIssue();
  if (issue) {
    throw new Error(issue);
  }

  const baseUrl = getAppBaseUrl()!;
  const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const html = [
    "<p>Você solicitou a redefinição de senha.</p>",
    `<p><a href="${link}">Redefinir senha</a> (válido por 1 hora)</p>`,
    "<p>Se você não pediu isso, ignore este e-mail.</p>"
  ].join("");

  await sendEmail({ to, subject: RESET_SUBJECT, html });
}
