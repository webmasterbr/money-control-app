# Money Control App

Aplicação web minimalista para **gerenciamento de finanças pessoais**, construída com foco em simplicidade, clareza e possibilidade de evolução futura.

## Stack

- **Framework**: Next.js (App Router, Server Components)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Banco de dados**: PostgreSQL
- **ORM**: Prisma
- **Autenticação**: JWT com cookies HttpOnly

Estrutura principal de pastas:

- `app/` – páginas, rotas de API (App Router) e layout
- `components/` – componentes de UI reutilizáveis (client e server components)
- `lib/` – helpers de infraestrutura (Prisma, auth, validações)
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
- `dueDay` (int opcional – dia de vencimento)
- `competenceMonth` (string `YYYY-MM`, **derivado da `date`** ao criar/atualizar no serviço; não é enviado pelo cliente)
- `createdAt`

Índices:

- `@@index([userId, date])`
- `@@index([userId, isFixed])`
- `@@index([userId, competenceMonth])`

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
- `components/BottomNav.tsx` – navegação inferior (logado): Dashboard, Receitas, Despesas, **Config** (menu com **Perfil** e **Sair** via `LogoutButton`).
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
  - `listIncomes(userId)` – lista receitas do usuário, ordenadas por data desc.
  - `createIncome(userId, data)` – cria nova receita.
  - `updateIncome(userId, incomeId, data)` – atualiza uma receita do usuário.
  - `deleteIncome(userId, incomeId)` – exclui receita do usuário.

Rotas de API:

- `GET /api/incomes` – lista receitas do usuário autenticado.
- `POST /api/incomes` – cria receita (validação com Zod em `incomeSchema`).
- `PUT /api/incomes/[id]` – atualiza receita específica.
- `DELETE /api/incomes/[id]` – exclui receita específica.

UI:

- Página: `app/incomes/page.tsx` (Server Component)
  - Garante que o usuário está logado via `getCurrentUser`.
  - Renderiza `IncomesPageClient`.
- Componente: `components/IncomesPageClient.tsx` (Client Component)
  - Faz `GET /api/incomes` ao montar.
  - Formulário simples para criar receita:
    - `amount`, `category`, `date`, `description`.
  - Lista em tabela responsiva com formatação de valor em BRL.
  - Ação de exclusão rápida de receita.

### 3. Despesas (Expenses)

Camada de serviço:

- `services/expenseService.ts`
  - `listExpenses(userId)` – lista despesas do usuário.
  - `createExpense(userId, data)` – cria despesa (inclusive fixa).
  - `updateExpense(userId, expenseId, data)` – atualiza despesa.
  - `deleteExpense(userId, expenseId)` – exclui despesa.

Rotas de API:

- `GET /api/expenses` – lista despesas do usuário autenticado.
- `POST /api/expenses` – cria despesa (validação com Zod em `expenseSchema`).
- `PUT /api/expenses/[id]` – atualiza despesa.
- `DELETE /api/expenses/[id]` – exclui despesa.

UI:

- Página: `app/expenses/page.tsx` (Server Component)
  - Garante autenticação e renderiza `ExpensesPageClient`.
- Componente: `components/ExpensesPageClient.tsx` (Client Component)
  - Formulário focado em **registro rápido** (campos reutilizados em modal de edição):
    - `amount`, `category`, `description`, `date`; `competenceMonth` é calculada no backend a partir da data (`lib/expenseCompetence.ts`).
    - `isFixed` (checkbox) e `dueDay` (dia vencimento, opcional).
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

- `lib/dashboardMonth.ts` – interpreta `?month=YYYY-MM` (query opcional; inválido ou ausente → mês corrente no fuso do servidor). Se o mês selecionado for o **mês calendário atual**, usa **hoje real** como `referenceDate`; caso contrário, usa o **dia 1** do mês selecionado (evita ambiguidade de UTC em `new Date('YYYY-MM')`).

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

---

## Arquitetura e separação de responsabilidades

- **UI**:
  - `app/*/page.tsx` geralmente como Server Components, responsáveis por:
    - Garantir autenticação.
    - Chamar serviços de domínio.
    - Compor layout com componentes de UI.
  - `components/*` concentra Client Components (formularios, tabelas, gráficos).

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
  - `lib/validation.ts` – schemas Zod reutilizáveis.

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
   - `/dashboard` – visão geral.
   - `/incomes` – receitas.
   - `/expenses` – despesas.

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
- **Filtros e relatórios avançados** (por período, por categoria, por centro de custo).
- **Exportação** (CSV/Excel) das receitas e despesas.

Essa base já está preparada com boa separação entre UI, domínio e infraestrutura para suportar essas evoluções.

