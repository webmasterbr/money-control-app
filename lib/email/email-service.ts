import { Resend } from "resend";

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({
  to,
  subject,
  html
}: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY ausente ou vazio");
  }

  const from = process.env.MAIL_FROM?.trim();
  if (!from) {
    throw new Error("MAIL_FROM ausente ou vazio");
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to, subject, html });

  if (error) {
    throw new Error(error.message);
  }
}
