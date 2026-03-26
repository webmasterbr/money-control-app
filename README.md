# Money Control App

Aplicação web minimalista para **gerenciamento de finanças pessoais**, construída com foco em simplicidade, clareza e possibilidade de evolução futura.

## Stack

- **Framework**: Next.js (App Router, Server Components)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Banco de dados**: PostgreSQL
- **ORM**: Prisma
- **Validação**: Zod (schemas em `lib/validation.ts`)
- **Autenticação**: JWT com cookies HttpOnly

Estrutura principal de pastas:

- `app/` – páginas, rotas de API (App Router) e layout
- `components/` – componentes de UI reutilizáveis (client e server components)
- `lib/` – helpers de infraestrutura (Prisma, auth, validações, mês do dashboard)
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

### Income

- `id` (UUID, PK)
- `userId` (FK → User)
- `amount` (Decimal(12,2))
- `category` (string)
- `description` (string opcional)
- `date` (DateTime)
- `createdAt`

Índices:

- `@@index([userId, date])`

### Expense

- `id` (UUID, PK)
- `userId` (FK → User)
- `amount` (Decimal(12,2))
- `category` (string)
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
- `components/BottomNav.tsx` – navegação inferior (logado): Dashboard, Receitas, Despesas, **Config** (menu com **Perfil** e **Sair** via `LogoutButton`). Os links Dashboard / Receitas / Despesas preservam **`?month=YYYY-MM`** quando esse parâmetro é válido na URL (via `useDashboardMonth`).
- `app/layout.tsx` – envolve `BottomNav` em `<Suspense>` (requisito do `useSearchParams` no hook acima).
- `components/LogoutButton.tsx` – encerra sessão (`POST /api/logout`); usado no menu Config.
- `app/profile/page.tsx` – página **Perfil** (nome, e-mail, data de cadastro).
- `app/api/auth/me/route.ts` – retorna dados do usuário autenticado
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
    - `amount`, `category`, `date`, `description`.
  - Lista em tabela responsiva com formatação de valor em BRL.
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
    - `amount`, `category`, `description`, `date`; `competenceMonth` é calculada no backend a partir da data (`lib/expenseCompetence.ts`).
    - `isFixed` (checkbox) e `dueDay`: **obrigatório (1–31)** quando fixa (HTML5 `required`, validação no cliente e nas APIs).
  - Campos compartilhados: `components/ExpenseFormFields.tsx`.
  - Tabela com:
    - Data, categoria, descrição, tipo (fixa/variável), vencimento, mês de competência, valor.
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
  - Recebe `expensesByCategory` e desenha gráfico de pizza responsivo.
- `components/IncomesPieChart.tsx` (Client Component, Recharts)
  - Recebe `incomesByCategory` e desenha gráfico de pizza responsivo.

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

Crie um arquivo `.env` na raiz com base em `.env.example`:

```env
DATABASE_URL="postgresql://money:money_password@localhost:5432/money_control_app?schema=public"
JWT_SECRET="uma_chave_bem_secreta_aqui"
```

Ajuste usuário/senha/host conforme o seu `docker-compose.yml` ou ambiente de banco.

### 4. Instalar dependências

```bash
npm install
```

### 5. Gerar Prisma Client e aplicar migrações

```bash
npm run prisma:generate
npm run prisma:migrate
```

Isso vai criar as tabelas `User`, `Income` e `Expense` no banco configurado.

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

- Definir corretamente as variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`).
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

