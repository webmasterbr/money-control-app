import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function SobrePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Sobre
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Informações sobre o ClickSaldo
        </p>
      </section>

      <section className="card p-4">
        <div>
          <h2 className="text-xs font-medium uppercase text-slate-600 dark:text-slate-400">
            Sobre o ClickSaldo
          </h2>
          <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">
            O ClickSaldo é um aplicativo de controle financeiro pessoal criado para
            ajudar você a entender seus gastos, organizar sua vida financeira e
            tomar decisões mais inteligentes com o seu dinheiro.
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-xs font-medium uppercase text-slate-600 dark:text-slate-400">
            Desenvolvedor
          </h2>
          <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">
            Weber Souza
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-xs font-medium uppercase text-slate-600 dark:text-slate-400">
            Contato
          </h2>
          <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">
            <a
              href="mailto:contato@clicksaldo.com"
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              contato@clicksaldo.com
            </a>
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-xs font-medium uppercase text-slate-600 dark:text-slate-400">
            Privacidade
          </h2>
          <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">
            Seus dados são privados e utilizados apenas dentro da aplicação.
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-xs font-medium uppercase text-slate-600 dark:text-slate-400">
            Versão
          </h2>
          <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">
            0.1.3
          </p>
        </div>
      </section>
    </div>
  );
}
