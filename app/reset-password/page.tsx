import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

type PageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

const INVALID_MESSAGE =
  "Este link é inválido ou expirou. Solicite uma nova redefinição de senha.";

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const raw = sp.token;
  const token = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;

  if (!token) {
    return (
      <div className="mx-auto mt-10 max-w-md">
        <div className="card p-6">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Link inválido
          </h1>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            {INVALID_MESSAGE}
          </p>
          <p className="mt-6 text-center text-sm">
            <Link href="/forgot-password" className="font-medium">
              Solicitar novo link
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const row = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { expiresAt: true }
  });

  const now = new Date();
  if (!row || row.expiresAt <= now) {
    return (
      <div className="mx-auto mt-10 max-w-md">
        <div className="card p-6">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Link inválido
          </h1>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            {INVALID_MESSAGE}
          </p>
          <p className="mt-6 text-center text-sm">
            <Link href="/forgot-password" className="font-medium">
              Solicitar novo link
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
