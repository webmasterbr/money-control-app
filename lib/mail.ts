import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { getAppBaseUrl } from "@/lib/passwordResetToken";

/**
 * Remetente do e-mail. Em desenvolvimento, se `MAIL_FROM` não existir,
 * usa um endereço local aceito por Mailpit/MailHog e similares.
 */
export function getEffectiveMailFrom(): string | undefined {
  const from = process.env.MAIL_FROM?.trim();
  if (from) {
    return from;
  }
  if (process.env.NODE_ENV === "development") {
    return "Saldo Certo <noreply@localhost>";
  }
  return undefined;
}

const DEV_SMTP_DEFAULT_HOST = "localhost";
/** Porta SMTP padrão do Mailpit (captura local sem enviar para a internet). */
const DEV_SMTP_DEFAULT_PORT = 1025;

function getSmtpHost(): string | undefined {
  const trimmed = process.env.SMTP_HOST?.trim();
  if (trimmed) {
    return trimmed;
  }
  if (process.env.NODE_ENV === "development") {
    return DEV_SMTP_DEFAULT_HOST;
  }
  return undefined;
}

function getSmtpPort(): number | undefined {
  const portRaw = process.env.SMTP_PORT?.trim();
  if (portRaw) {
    const port = Number(portRaw);
    if (Number.isFinite(port) && port >= 1 && port <= 65535) {
      return port;
    }
    return undefined;
  }
  if (process.env.NODE_ENV === "development") {
    return DEV_SMTP_DEFAULT_PORT;
  }
  return undefined;
}

function createTransport(): nodemailer.Transporter | null {
  const host = getSmtpHost();
  const port = getSmtpPort();

  if (!host || port === undefined) {
    return null;
  }

  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS ?? "";
  const useAuth = user.length > 0 && pass.length > 0;

  const options: SMTPTransport.Options = {
    host,
    port,
    secure: port === 465
  };

  if (useAuth) {
    options.auth = { user, pass };
  }

  return nodemailer.createTransport(options);
}

/** Motivo legível para logs (sem segredos). */
export function getPasswordResetMailConfigIssue(): string | null {
  if (!getAppBaseUrl()) {
    return "APP_URL ausente (em produção defina APP_URL ou use deploy na Vercel com VERCEL_URL)";
  }
  if (!getEffectiveMailFrom()) {
    return "MAIL_FROM ausente (obrigatório em produção)";
  }
  const host = getSmtpHost();
  const port = getSmtpPort();
  const portRaw = process.env.SMTP_PORT?.trim();
  if (!host) {
    return "SMTP_HOST ausente (obrigatório em produção)";
  }
  if (port === undefined) {
    if (portRaw) {
      return "SMTP_PORT inválido";
    }
    return "SMTP_PORT ausente (obrigatório em produção)";
  }
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS ?? "";
  if ((user.length > 0) !== (pass.length > 0)) {
    return "SMTP_USER e SMTP_PASS devem estar ambos preenchidos ou ambos vazios (servidor sem auth)";
  }
  return null;
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const configIssue = getPasswordResetMailConfigIssue();
  if (configIssue) {
    throw new Error(configIssue);
  }

  const from = getEffectiveMailFrom()!;
  const baseUrl = getAppBaseUrl()!;
  const transport = createTransport();

  if (!transport) {
    throw new Error("Não foi possível criar o transporte SMTP");
  }

  const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await transport.sendMail({
    from,
    to,
    subject: "Redefinição de senha — Saldo Certo",
    text: [
      "Você solicitou a redefinição de senha.",
      "",
      `Acesse o link abaixo (válido por 1 hora):`,
      link,
      "",
      "Se você não pediu isso, ignore este e-mail."
    ].join("\n")
  });
}
