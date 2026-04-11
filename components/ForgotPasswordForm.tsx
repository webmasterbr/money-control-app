"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar. Tente novamente.");
        return;
      }

      setSent(true);
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card p-6">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Esqueci minha senha
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Informe seu e-mail para receber o link de redefinição.
        </p>

        {sent ? (
          <p className="mt-6 text-sm text-slate-700 dark:text-slate-300">
            Se o e-mail existir, você receberá instruções para redefinir sua senha.
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor="forgot-email">
                E-mail
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                className="input mt-1"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button
              type="submit"
              className="btn-primary mt-2 w-full"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          <Link href="/login" className="font-medium">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
