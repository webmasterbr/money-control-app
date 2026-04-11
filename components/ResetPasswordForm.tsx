"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  token: string;
};

export function ResetPasswordForm({ token }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível redefinir. Tente novamente.");
        return;
      }

      setDone(true);
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
          Nova senha
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Escolha uma nova senha para sua conta.
        </p>

        {done ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Senha redefinida. Você já pode entrar com a nova senha.
            </p>
            <Link href="/login" className="btn-primary inline-block w-full text-center">
              Ir para o login
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor="new-password">
                Nova senha
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                className="input mt-1"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                maxLength={100}
                disabled={loading}
              />
            </div>
            <div>
              <label className="label" htmlFor="confirm-password">
                Confirmar senha
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                className="input mt-1"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                maxLength={100}
                disabled={loading}
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button
              type="submit"
              className="btn-primary mt-2 w-full"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
