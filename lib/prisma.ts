import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // Настройка Prisma Client для работы с PgBouncer (Session Pooler)
  // PgBouncer не поддерживает prepared statements
  // Решение: используйте Transaction Pooler вместо Session Pooler в Supabase
  // Или добавьте параметр ?prepare=false в connection string (если поддерживается)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
