# Click Saldo App

Aplicação web minimalista para **gerenciamento de finanças pessoais**, construída com foco em simplicidade, clareza e possibilidade de evolução futura.

## Stack

- **Framework**: Next.js (App Router, Server Components)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Banco de dados**: PostgreSQL
- **ORM**: Prisma
- **Validação**: Zod (schemas em `lib/validation.ts`)
- **Autenticação**: JWT com cookies HttpOnly
- **Ícones (UI)**: Lucide (`lucide-react`) — categorias de receitas e despesas

Estrutura principal de pastas:

- `app/` – páginas, rotas de API (App Router) e layout
- `components/` – componentes de UI reutilizáveis (client e server components)
- `lib/` – helpers de infraestrutura (Prisma, auth, e-mail via Resend, validações, mês do dashboard, **tema**, **categorias**)
- `lib/hooks/` – hooks de cliente (ex.: `useDashboardMonth`)
- `services/` – lógica de negócio (incomes, expenses, dashboard)
- `prisma/` – schema e migrações do Prisma
- `types/` – tipos compartilhados (reservado para futuras extensões)

---

## Modelagem de dados (Prisma)

Arquivo: `prisma/schema.prisma`

### User

- `id` (UUID, PK)
- `email` (único)
- `password` (hash via bcrypt)
- `firstName`, `lastName` (opcionais; preenchidos no cadastro)
- `createdAt`

Relacionamentos:

- `incomes` – receitas do usuário
- `expenses` – despesas do usuário

### PasswordResetToken

- `id` (cuid, PK)
- `email` (string; corresponde ao e-mail do `User` no momento da solicitação)
- `token` (string única; valor gerado com `crypto.randomBytes`, válido por **1 hora** no fluxo atual)
- `expiresAt`, `createdAt`

Índice:

- `@@index([email])` – facilita invalidar tokens anteriores ao solicitar um novo reset para o mesmo e-mail.

### Income

- `id` (UUID, PK)
- `userId` (FK → User)
- `amount` (Decimal(12,2))
- `category` (string — ID da categoria; valores e rótulos em `lib/incomeCategories.ts`, validação Zod na API)
- `description` (string opcional)
- `date` (DateTime)
- `createdAt`

Índices:

- `@@index([userId, date])`

### Expense

- `id` (UUID, PK)
- `userId` (FK → User)
- `amount` (Decimal(12,2))
- `category` (string — ID da categoria; valores e rótulos em `lib/categories.ts`, validação Zod na API)
- `description` (string opcional)
- `date` (DateTime)
- `isFixed` (boolean, default `false`)
- `dueDay` (int opcional no banco; **obrigatório na aplicação** quando `isFixed === true`, inteiro **1–31** – validado no Zod, na API PUT e no formulário)
- `competenceMonth` (string `YYYY-MM`, **derivado da `date`** ao criar/atualizar no serviço; não é enviado pelo cliente)
- `sourceExpenseId` (UUID opcional, FK → `Expense.id`, `onDelete: SetNull`) – **uso interno**: `null` em despesas criadas manualmente; nas criadas pela **importação de despesas fixas**, aponta para o **ID raiz** da cadeia (`sourceExpenseId ?? id` da despesa de origem), para idempotência e evitar duplicar o mesmo vínculo no mesmo mês.
- `createdAt`

Relacionamentos:

- `sourceExpense` / `importedFrom` – auto-relação para a despesa raiz e cópias importadas.

Índices e restrições:

- `@@index([userId, date])`
- `@@index([userId, isFixed])`
- `@@index([userId, competenceMonth])`
- `@@unique([userId, competenceMonth, sourceExpenseId])` – garante no máximo uma despesa importada por raiz e mês de competência (várias linhas com `sourceExpenseId` nulo continuam permitidas no PostgreSQL).

---

## Fluxos principais

### 1. Autenticação (email + senha, JWT)

Arquivos principais:

- `lib/auth.ts` – helpers de autenticação:
  - `hashPassword`, `verifyPassword` – hash e verificação com **bcrypt**
  - `signUserJwt`, `verifyUserJwt` – geração e validação do JWT
  - `setAuthCookie`, `clearAuthCookie` – grava/limpa cookie `moneycontrol_session` (HttpOnly, `sameSite=lax`)
  - `getCurrentUser` – lê o cookie, valida o token e busca o `User` no Prisma
- `lib/validation.ts` – schemas de validação Zod para login/registro
- `app/api/auth/register/route.ts` – cria usuário, valida dados, faz hash da senha, seta cookie de sessão
- `app/api/auth/login/route.ts` – autentica credenciais, gera JWT e seta cookie
- `app/api/auth/logout/route.ts` – limpa cookie de sessão (`POST`)
- `components/BottomNav.tsx` – navegação inferior (logado): Dashboard, Receitas, Despesas, **Config** (menu com **Configurações** (`/settings`), **Perfil** e **Sair** via `LogoutButton`). Os links Dashboard / Receitas / Despesas preservam **`?month=YYYY-MM`** quando esse parâmetro é válido na URL (via `useDashboardMonth`).
- `app/layout.tsx` – envolve `BottomNav` em `<Suspense>` (requisito do `useSearchParams` no hook acima).
- `components/LogoutButton.tsx` – encerra sessão (`POST /api/logout`); usado no menu Config.
- `app/profile/page.tsx` – página **Perfil** (nome, e-mail, data de cadastro).
- `app/api/auth/me/route.ts` – retorna dados do usuário autenticado
- `app/api/auth/forgot-password/route.ts` – solicita reset (`POST`); resposta sempre `{ success: true }` para não revelar se o e-mail existe
- `app/api/auth/reset-password/route.ts` – redefine senha com `token` + `newPassword` (`POST`)
- `lib/email/email-service.ts` – envio genérico via **Resend** (`sendEmail`)
- `lib/email/password-reset-mail.ts` – e-mail de redefinição de senha (HTML + link)
- `lib/passwordResetToken.ts` – geração do token e URL base (`APP_URL`)
- `app/forgot-password/page.tsx` – formulário “esqueci minha senha”
- `app/reset-password/page.tsx` – validação do token (server) e formulário de nova senha
- `middleware.ts` – protege rotas `/dashboard`, `/incomes`, `/expenses`, `/profile` redirecionando para `/login` caso não haja sessão

Fluxo resumido:

1. Usuário acessa `/register` ou `/login`.
2. `AuthForm` (client component) envia `POST` para `/api/auth/register` (nome, sobrenome, e-mail, senha) ou `/api/auth/login`.
3. API valida dados (Zod), acessa Prisma, e em caso de sucesso:
   - Gera um JWT com `userId` e `email`.
   - Grava o token em um cookie HttpOnly.
4. Middleware verifica o cookie em rotas protegidas.
5. Server Components usam `getCurrentUser()` para obter o usuário logado.

### 2. Receitas (Incomes)

Camada de serviço:

- `services/incomeService.ts`
  - `listIncomes(userId, { yearMonth })` – lista receitas cujo **`date`** cai no mês calendário `yearMonth` (`YYYY-MM`), ordenadas por data desc.
  - `createIncome(userId, data)` – cria nova receita.
  - `updateIncome(userId, incomeId, data)` – atualiza uma receita do usuário.
  - `deleteIncome(userId, incomeId)` – exclui receita do usuário.

Rotas de API:

- `GET /api/incomes?month=YYYY-MM` – lista receitas do mês (query opcional: ausente ou vazio → **mês calendário atual**; formato inválido → **400** com `Mês inválido`). Implementação: `parseYearMonthListQuery` em `lib/dashboardMonth.ts`.
- `POST /api/incomes` – cria receita (validação com Zod em `incomeSchema`).
- `PUT /api/incomes/[id]` – atualiza receita específica.
- `DELETE /api/incomes/[id]` – exclui receita específica.

UI:

- Página: `app/incomes/page.tsx` (Server Component)
  - Garante que o usuário está logado via `getCurrentUser`.
  - Lê `searchParams.month`, resolve o mês com `resolveDashboardMonth` (mesma regra que o dashboard) e passa `listYearMonth` ao cliente.
- Componente: `components/IncomesPageClient.tsx` (Client Component)
  - Carrega dados com `GET /api/incomes?month=...` alinhado ao mês da página.
  - Formulário simples para criar receita:
    - `amount`, **`category`** (seletor customizado com ícone + rótulo; IDs definidos em `lib/incomeCategories.ts`), `date`, `description`.
  - Lista em tabela responsiva com formatação de valor em BRL; **categoria** exibida com o mesmo padrão visual (ícone + nome).
  - Ação de exclusão rápida de receita.

### 3. Despesas (Expenses)

Camada de serviço:

- `services/expenseService.ts`
  - `listExpenses(userId, { competenceMonth })` – lista despesas do usuário com **`competenceMonth`** igual ao mês pedido (`YYYY-MM`), ordenadas por data desc.
  - `createExpense(userId, data)` – cria despesa (inclusive fixa); define `competenceMonth` a partir da data; `sourceExpenseId` permanece `null`.
  - `updateExpense(userId, expenseId, data)` – atualiza despesa (recalcula `competenceMonth` se `date` mudar).
  - `deleteExpense(userId, expenseId)` – exclui despesa.
  - `importFixedExpenses(userId, currentMonth)` – importação **sob demanda** (não roda ao trocar de mês): lê despesas **fixas** (`isFixed === true`) do **mês de competência anterior** a `currentMonth`, e para cada uma cria uma cópia no `currentMonth` se ainda não existir linha com o mesmo vínculo raiz (`sourceExpenseId` da cópia = `origem.sourceExpenseId ?? origem.id`). Copia `amount`, `category`, `description`, `isFixed`, `dueDay`; ajusta `competenceMonth` e `date` (dia de vencimento no mês alvo, com **clamp** ao último dia do mês via `dateStringForCompetenceAndDueDay` em `lib/expenseCompetence.ts`). Transação com tratamento de **`P2002`** (unique) para idempotência sob requisições concorrentes. Retorna `{ imported, skipped }`.

Rotas de API:

- `GET /api/expenses?month=YYYY-MM` – lista por competência (query opcional: ausente ou vazio → **mês atual**; inválido → **400**). Implementação: `parseExpenseListMonthParam` em `lib/dashboardMonth.ts`.
- `POST /api/expenses` – cria despesa (`expenseSchema` no Zod: se `isFixed`, exige `dueDay` **1–31**).
- `POST /api/expenses/import-fixed` – importa despesas fixas do mês anterior para o mês indicado. Body JSON: `{ "month": "YYYY-MM" }` (mês em visualização / alvo), validado com **`importFixedExpensesSchema`** em `lib/validation.ts`. O servidor deriva o mês anterior internamente (não aceita `fromMonth` no cliente). Resposta **200**: `{ "imported": number, "skipped": number }`. **401** se não autenticado; **400** se o body for inválido; **500** com mensagem genérica em falha interna.
- `PUT /api/expenses/[id]` – atualização parcial do corpo validada com **`expensePartialWithoutDueDaySchema`** (`dueDay` vem à parte do JSON e é checado no handler quando `isFixed`); evita `.partial()` direto no schema com `.refine()` por limitação do **Zod 4**.
- `DELETE /api/expenses/[id]` – exclui despesa.

UI:

- Página: `app/expenses/page.tsx` (Server Component)
  - Garante autenticação, resolve `searchParams.month` com `resolveDashboardMonth` e passa **`listCompetenceMonth`** a `ExpensesPageClient`.
- Componente: `components/ExpensesPageClient.tsx` (Client Component)
  - Carrega lista com `GET /api/expenses?month=...` coerente com o mês da página; após criar/editar/excluir, recarrega com o mesmo mês.
  - Botão minimalista **Importar despesas fixas** (ao lado do título da lista): `POST /api/expenses/import-fixed` com `{ month: listCompetenceMonth }`, feedback com contagem importada/ignorada e nova carga da lista. `sourceExpenseId` **não** é exibido na UI.
  - Formulário focado em **registro rápido** (campos reutilizados em modal de edição):
    - `amount`, **`category`** (seletor customizado com ícone + rótulo; IDs em `lib/categories.ts`), `description`, `date`; `competenceMonth` é calculada no backend a partir da data (`lib/expenseCompetence.ts`).
    - `isFixed` (checkbox) e `dueDay`: **obrigatório (1–31)** quando fixa (validação no cliente e nas APIs).
  - Campos compartilhados: `components/ExpenseFormFields.tsx` + `ExpenseCategorySelect` (baseado em `CategoryPicker`).
  - Tabela com:
    - Data, **categoria** (ícone + nome), descrição, tipo (fixa/variável), vencimento, mês de competência, valor.
  - Ações **Editar** (modal com formulário preenchido + salvar) e **Excluir**.

### 4. Dashboard

Camada de serviço:

- `services/dashboardService.ts`
  - `getDashboardSummary(userId, referenceDate?, options?)` retorna agregados do **mês calendário** de `referenceDate` (`startOfMonth` / `endOfMonth`):
    - `incomesTotal`, `expensesTotal`, `balance`, `fixedExpensesTotal`.
    - `upcomingFixedExpenses` – sublista de despesas fixas do mês (ver `options.fixedListMode` abaixo).
    - `expensesByCategory`, `incomesByCategory` – para os gráficos de pizza.
  - `options.fixedListMode`:
    - `next7Days` (padrão) – apenas fixas com `dueDay` na janela do dia atual até +7 dias (modo operacional).
    - `fullMonth` – todas as fixas do mês, ordenadas por `dueDay` (nulos por último).

- `lib/dashboardMonth.ts` – utilitários compartilhados para o mês na URL:
  - `resolveDashboardMonth` – usado nas páginas **dashboard**, **receitas** e **despesas**: `?month=YYYY-MM` opcional; inválido ou ausente → mês corrente (fuso do servidor na resolução server-side). Se o mês for o **calendário atual**, `referenceDate` é **hoje**; senão, **dia 1** do mês (evita ambiguidade de UTC em `new Date('YYYY-MM')`).
  - `parseYearMonthListQuery` / `parseExpenseListMonthParam` – parse para APIs de listagem (receitas por `date`, despesas por `competenceMonth`).
  - `isValidCompetenceMonth` / `previousCompetenceMonth` – validação de string `YYYY-MM` e cálculo do mês de competência anterior (usados na importação de despesas fixas).
  - `isValidDashboardMonthQuery` – validação no cliente (mesmo padrão `YYYY-MM` que o servidor).
  - `ROUTES_WITH_MONTH_SEARCH_PARAM` – rotas em que a navegação deve preservar `?month=`.
- `lib/hooks/useDashboardMonth.ts` – hook de cliente: expõe `yearMonth`, `monthQuery`, `hrefWithMonth(path)` etc., alinhado a `resolveDashboardMonth` / `isValidDashboardMonthQuery`.

Página:

- `app/dashboard/page.tsx` (Server Component)
  - Lê `searchParams.month`, resolve mês com `resolveDashboardMonth`, chama `getDashboardSummary` com `fixedListMode` conforme mês atual ou não.
  - `components/DashboardMonthSelector.tsx` – navegação por mês em pt-BR (setas anterior/próximo, rótulo “Março de 2026”, botão **Hoje**) + `router.replace` para `/dashboard?month=YYYY-MM` ou `/dashboard` (mês atual).
  - Renderiza:
    - Cards com **Receitas no mês**, **Despesas no mês**, **Saldo restante** e **Situação do mês** (indicador usa os totais do mês selecionado).
    - **Despesas fixas**: total do mês; subtítulo **Próximas a vencer (7 dias)** no mês atual ou **Vencimentos deste mês** em outros meses.
    - Gráficos de pizza: despesas e receitas por categoria.

Gráficos:

- `components/ExpensesPieChart.tsx` (Client Component, Recharts)
  - Recebe `expensesByCategory` e desenha gráfico de pizza responsivo; rótulos de categoria via `getExpenseCategoryLabel` (`lib/categories.ts`).
- `components/IncomesPieChart.tsx` (Client Component, Recharts)
  - Recebe `incomesByCategory` e desenha gráfico de pizza responsivo; rótulos via `getIncomeCategoryLabel` (`lib/incomeCategories.ts`).

#### Padrão de títulos de cards (dashboard)

- Usar **Sentence case** em todos os títulos de card.
- Maiúscula apenas na primeira palavra e em nomes próprios/siglas (ex.: `PIX`, `IOF`, `IR`).
- Preposições e conectivos (`de`, `do`, `da`, `no`, `na`, `e`, `vs`) ficam em minúsculo, exceto se iniciarem o título.
- Não usar `uppercase` em títulos principais de cards.
- Classe padrão para título principal: `text-sm font-semibold text-slate-800 dark:text-slate-200` (usar `mb-2` quando houver conteúdo logo abaixo).

### 5. Mês selecionado na URL (`?month=YYYY-MM`)

- O **dashboard** grava o mês em `?month=` ao mudar período (`DashboardMonthSelector`).
- As páginas **Receitas** e **Despesas** leem o mesmo parâmetro no servidor e filtram listas de acordo (receitas pelo campo `date`, despesas por `competenceMonth`).
- A **`BottomNav`** mantém `?month=` ao alternar entre `/dashboard`, `/incomes` e `/expenses`, desde que o valor seja válido; URLs inválidas são ignoradas no cliente e caem no mês atual na resolução server-side.
- APIs `GET /api/incomes` e `GET /api/expenses` repetem a regra de parse (mês atual se ausente; **400** se o formato for inválido).

---

## Arquitetura e separação de responsabilidades

- **UI**:
  - `app/*/page.tsx` geralmente como Server Components, responsáveis por:
    - Garantir autenticação.
    - Chamar serviços de domínio.
    - Compor layout com componentes de UI.
  - `components/*` concentra Client Components (formulários, tabelas, gráficos).

- **Negócio / domínio**:
  - `services/*` implementa regras de negócio e acesso ao banco via Prisma.
  - API Routes (`app/api/**`) fazem:
    - Autenticação/autorização (`getCurrentUser`).
    - Validação de dados (Zod).
    - Chamada dos serviços.
    - Serialização de resposta.

- **Infraestrutura**:
  - `lib/prisma.ts` – singleton do Prisma.
  - `lib/auth.ts` – JWT, cookies, hash de senha.
  - `lib/validation.ts` – schemas Zod reutilizáveis (`expenseSchema` com refine para despesa fixa; `expensePartialWithoutDueDaySchema` só para corpo do **PUT**, sem refine, por compatibilidade com Zod 4; `importFixedExpensesSchema` para o body de **`POST /api/expenses/import-fixed`**).
  - `lib/dashboardMonth.ts` – mês `YYYY-MM` para páginas e APIs de listagem; `isValidCompetenceMonth` / `previousCompetenceMonth` para a importação de fixas.
  - `lib/expenseCompetence.ts` – derivação de `competenceMonth` a partir da data e `dateStringForCompetenceAndDueDay` (importação de fixas).
  - `lib/hooks/useDashboardMonth.ts` – leitura consistente de `?month=` no cliente.

Isso permite escalar facilmente para novos canais (ex.: API externa, jobs de notificação) reutilizando os mesmos serviços de negócio.

### Categorias (receitas e despesas)

- No **banco**, `Income.category` e `Expense.category` são **strings** com IDs estáveis (ex.: `SALARY`, `FOOD`, `OTHER`). Não duplicar listas de categorias em componentes: usar sempre os módulos abaixo.
- **Despesas**: `lib/categories.ts` — `expenseCategories` (rótulo, ícone Lucide, ordem), `EXPENSE_CATEGORY_IDS` alinhado ao **`z.enum`** em `lib/validation.ts` (`expenseSchema` / atualizações parciais). Helpers: `getCategoryById`, `getExpenseCategoryLabel`, `getExpenseCategoryDisplay` (valor desconhecido: ícone de “Outros” + texto bruto do ID).
- **Receitas**: `lib/incomeCategories.ts` — mesma ideia (`incomeCategories`, `INCOME_CATEGORY_IDS`, `z.enum` no `incomeSchema`), com `getIncomeCategoryById`, `getIncomeCategoryLabel`, `getIncomeCategoryDisplay`.
- **UI compartilhada**: `lib/categoryIconClass.ts` (`CATEGORY_ICON_CLASS`, classe Tailwind para tamanho/cor dos ícones); `components/CategoryPicker.tsx` (listbox acessível); `ExpenseCategorySelect` e `IncomeCategorySelect` apenas conectam dados ao picker.

### Tema claro e escuro

- **Tailwind** (`tailwind.config.ts`): `darkMode: "class"`. O layout e os componentes usam utilitários `dark:` para fundo, texto e bordas.
- **`lib/theme.ts`**: chave `localStorage` (`THEME_STORAGE_KEY`), valores `light` | `dark`, funções `readStoredTheme`, `applyThemeClass` (adiciona/remove `dark` em `<html>`), `persistTheme` e o script inline **`THEME_INIT_SCRIPT`** (evita flash de tema errado antes da hidratação).
- **`app/layout.tsx`**: `Script` com `strategy="beforeInteractive"` + `ThemeProvider` (`components/ThemeProvider.tsx`) envolvendo o conteúdo; `useTheme()` para ler/alterar o tema no cliente.
- **Onde mudar**: página **`/settings`** (`app/settings/page.tsx`) — `ThemeSettingsSection` alterna entre claro e escuro. Acesso pelo menu **Config** na barra inferior (`BottomNav`).

---

## Rodando o projeto localmente

### Pré-requisitos

- Node.js LTS (18+ recomendado)
- Docker + Docker Compose (recomendado para subir o PostgreSQL)

### 1. Clonar o projeto

```bash
git clone <seu-repo-url> money-control-app
cd money-control-app
```

> Caso tenha criado o projeto manualmente no diretório `c:\weber\money-control-app`, pule o `git clone` e apenas entre na pasta.

### 2. Subir o PostgreSQL com Docker

Um exemplo de `docker-compose.yml` na raiz do projeto:

```yaml
version: "3.9"

services:
  db:
    image: postgres:16
    container_name: money-control-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: money
      POSTGRES_PASSWORD: money_password
      POSTGRES_DB: money_control_app
    ports:
      - "5432:5432"
    volumes:
      - money_control_pgdata:/var/lib/postgresql/data

volumes:
  money_control_pgdata:
```

Subir o banco:

```bash
docker compose up -d
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz (não versionado) com pelo menos (há um modelo em `.env.example`):

```env
DATABASE_URL="postgresql://money:money_password@localhost:5432/money_control_app?schema=public"
JWT_SECRET="uma_chave_bem_secreta_aqui"

# Recuperação de senha (e-mail via Resend)
APP_URL="http://localhost:3000"
MAIL_FROM="Click Saldo <onboarding@resend.dev>"
RESEND_API_KEY="re_xxxxxxxx"
```

- **`APP_URL`**: origem pública da aplicação, **sem barra no final**; usada no link `.../reset-password?token=...`. Em **desenvolvimento**, se omitido, usa `http://localhost:` + variável `PORT` ou `3000`. Em **produção**, defina `APP_URL` (recomendado) ou use deploy na Vercel (`VERCEL_URL` é usado automaticamente em [`getAppBaseUrl`](lib/passwordResetToken.ts)).
- **`MAIL_FROM`**: remetente exibido no e-mail. Deve ser um **endereço verificado** no painel da [Resend](https://resend.com) (domínio próprio) ou, para testes iniciais, o remetente de testes indicado na documentação da Resend (ex.: `onboarding@resend.dev` quando aplicável).
- **`RESEND_API_KEY`**: chave de API da Resend. **Obrigatória** para enviar e-mails (local e produção). Sem ela, a rota de “esqueci minha senha” continua respondendo `{ success: true }`, mas o e-mail não é enviado e o servidor registra o erro.
- Não há SMTP local nem Nodemailer: todo envio passa pela API da Resend.
- Se algo estiver incorreto na configuração ou na API, a API de “esqueci minha senha” ainda responde com sucesso (por segurança), mas o e-mail pode não ser enviado — veja os logs do servidor.

Ajuste `DATABASE_URL` conforme o seu `docker-compose.yml` ou ambiente de banco.

#### Link de redefinição abre 404

O href do e-mail é sempre `{APP_URL ou origem do deploy}/reset-password?token=...` (ver [`getAppBaseUrl`](lib/passwordResetToken.ts)). Um **404** indica que o **host** do link não está servindo esta aplicação Next (domínio antigo, DNS apontando para outro servidor, ou `APP_URL` divergente do site real).

1. Confira o domínio completo no link do e-mail e compare com onde você acessa o app.
2. Abra `https://<seu-dominio>/reset-password` **sem** query: deve aparecer a mensagem **“Link inválido”**, não 404. Se der 404, corrija DNS ou deploy antes de mudar código.
3. Na Vercel (ou outro host), defina **`APP_URL`** em **Production** com a URL canônica (sem barra final), faça **redeploy** e solicite um novo e-mail.
4. Nos logs do servidor, ao enviar o e-mail, aparece `[PASSWORD_RESET_MAIL] link origin: …` com a origem usada no link (útil para conferir se bate com o domínio público).
5. **`www` vs apex**: se `APP_URL` for `https://clicksaldo.com` e alguém abrir `https://www.clicksaldo.com/...`, o [`middleware`](middleware.ts) redireciona (308) para o host de `APP_URL`, desde que o pedido **chegue** ao Next.js. Na Vercel, adicione **ambos** os domínios em **Settings → Domains** no mesmo projeto; se `www` não estiver associado ao deploy, a Vercel pode responder 404 na borda **antes** do middleware.
6. **Página com nome ou marca antiga (ex.: outro produto) + 404**: isso confirma que a URL **não está a servir este repositório** (Click Saldo). O registo DNS de `www` (ou outro host) ainda pode apontar para um projeto ou hospedagem antiga. Corrija na Vercel/DNS: o **CNAME/A de `www`** deve apontar para o **mesmo** deploy que o domínio canônico; remova ou desative o projeto antigo que ainda responde por `www`. Nenhuma alteração no código substitui esse alinhamento.

#### Produção (ex.: Vercel)

No painel do projeto, em **Settings → Environment Variables**, defina pelo menos: `DATABASE_URL`, `JWT_SECRET`, `APP_URL` (URL pública do app), `MAIL_FROM`, `RESEND_API_KEY`. Use o mesmo `MAIL_FROM` verificado na Resend e uma API key com permissão de envio.

Para evitar saturação de conexões do Prisma em ambiente serverless (Vercel + Supabase), use a URL do **pooler** no runtime e mantenha uma URL direta para tarefas administrativas:

```env
# Runtime da aplicação (pooler / PgBouncer)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@[region].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1&pool_timeout=30"

# Migrations / prisma studio (conexão direta, sem pooler)
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require"
```

- Em produção, gere o Prisma Client e rode a app com `DATABASE_URL` apontando para o pooler.
- Use `DIRECT_URL` apenas em migrações (`prisma migrate`) e operações administrativas.
- Se houver `P2024`, ajuste `pool_timeout` e revise paralelismo de queries por request (o dashboard foi otimizado para reduzir fan-out).

### 4. Instalar dependências

```bash
npm install
```

### 5. Gerar Prisma Client e aplicar migrações

```bash
npm run prisma:generate
npm run prisma:migrate
```

Isso vai criar as tabelas do schema (incluindo `User`, `PasswordResetToken`, `Income` e `Expense`) no banco configurado.

### 6. Prisma Studio (visualizar e editar dados)

Para inspecionar e editar registros das tabelas (`User`, `Income`, `Expense`), use o Prisma Studio:

```bash
npm run prisma:studio
```

Isso abrirá o Prisma Studio em:

- `http://localhost:5555`

Enquanto o comando estiver rodando no terminal, você pode acessar esse link (recomenda-se salvar como favorito no navegador).

### 7. Rodar em modo desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`.

Fluxo sugerido:

1. Acessar `/register` para criar o primeiro usuário.
2. Fazer login em `/login` (ou `/`, que redireciona para `/login` se não autenticado).
3. Navegar:
   - `/dashboard` – visão geral (opcional: `?month=YYYY-MM` para outro mês).
   - `/incomes` – receitas do mês (mesma query opcional; alinhada ao dashboard se vier pela BottomNav).
   - `/expenses` – despesas por **competência** do mês (mesma ideia); use **Importar despesas fixas** para copiar as fixas do mês anterior para o mês em tela.

---

## Build e execução em produção

### Build

```bash
npm run build
```

### Start

```bash
npm run start
```

Certifique-se em produção de:

- Definir corretamente as variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`, `APP_URL`, `MAIL_FROM`, `RESEND_API_KEY` para recuperação de senha).
- Usar HTTPS para beneficiar-se do cookie `secure` (ativado automaticamente em `NODE_ENV=production`).
- Ter um banco PostgreSQL acessível pela aplicação.

---

## Próximos passos / extensões

Sugestões de evolução futura:

- **Notificações por e-mail** para despesas fixas próximas do vencimento:
  - Criar um job/cron que use `services/dashboardService` ou novas queries em `services/expenseService`.
- **Multi-moeda e multi-carteira** (contas bancárias, cartão, etc.).
- **Relatórios e filtros adicionais** (intervalos personalizados, categorias combinadas, centros de custo) — o filtro por **mês** (`?month=`) já cobre o caso base de receitas e despesas por período.
- **Exportação** (CSV/Excel) das receitas e despesas.

Essa base já está preparada com boa separação entre UI, domínio e infraestrutura para suportar essas evoluções.

