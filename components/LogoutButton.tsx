"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin"
      });
      if (!res.ok) {
        return;
      }
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-busy={loading}
      aria-label="Encerrar sessão"
      className="text-sm text-slate-400 transition-colors hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Saindo…" : "Sair"}
    </button>
  );
}
