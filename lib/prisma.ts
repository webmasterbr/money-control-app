import { PrismaClient } from "@prisma/client";

/**
 * Singleton em globalThis em qualquer NODE_ENV (warm containers na Vercel reutilizam a mesma instância).
 *
 * Supabase: prefira a URL do connection pooler (PgBouncer) compatível com Prisma —
 * https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
 *
 * Cache Next.js: para dashboard por usuário/mês, unstable_cache + revalidateTag nas mutações
 * evita dados velhos; ISR sem invalidação pode exibir totais desatualizados.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn", "error"]
  });

globalForPrisma.prisma = prisma;
