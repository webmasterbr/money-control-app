"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "register";

type Props = {
  mode: Mode;
};

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === "login";
  const from = searchParams.get("from");
  const authToggleHref = isLogin
    ? `/register${from ? `?from=${encodeURIComponent(from)}` : ""}`
    : `/login${from ? `?from=${encodeURIComponent(from)}` : ""}`;

  const forgotPasswordHref = `/forgot-password${
    from ? `?from=${encodeURIComponent(from)}` : ""
  }`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          isLogin
            ? { email, password }
            : { firstName, lastName, email, password }
        )
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao autenticar. Tente novamente.");
        return;
      }

      router.push(from || "/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card p-6">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {isLogin ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {isLogin
            ? "Acesse seu painel financeiro."
            : "Crie uma conta para controlar suas finanças."}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
              <div>
                <label className="label" htmlFor="firstName">
                  Nome
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  className="input mt-1"
                  placeholder="Maria"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  maxLength={80}
                />
              </div>
              <div>
                <label className="label" htmlFor="lastName">
                  Sobrenome
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  className="input mt-1"
                  placeholder="Silva"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  maxLength={80}
                />
              </div>
            </div>
          )}

          <div>
            <label className="label" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input mt-1"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="label mb-0" htmlFor="password">
                Senha
              </label>
              {isLogin && (
                <Link
                  href={forgotPasswordHref}
                  className="text-sm font-medium text-slate-600 dark:text-slate-400"
                  onClick={(e) => {
                    if (loading) e.preventDefault();
                  }}
                >
                  Esqueci minha senha
                </Link>
              )}
            </div>
            <input
              id="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="input mt-1"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button
            type="submit"
            className="btn-primary mt-2 w-full"
            disabled={loading}
          >
            {loading
              ? "Carregando..."
              : isLogin
              ? "Entrar"
              : "Criar conta"}
          </button>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            {isLogin ? "Ainda não tem cadastro?" : "Já possui cadastro?"}{" "}
            <Link
              href={authToggleHref}
              className="font-medium"
              aria-disabled={loading}
              onClick={(e) => {
                if (loading) {
                  e.preventDefault();
                }
              }}
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

