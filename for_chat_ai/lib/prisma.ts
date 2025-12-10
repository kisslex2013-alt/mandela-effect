import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // Настройка Prisma Client для работы с Supabase
  // Transaction Pooler не поддерживает prepared statements, которые использует Prisma
  // Решение: используем Direct Connection для всех операций (билд и runtime)
  // DATABASE_URL должен указывать на Direct Connection (порт 5432)
  // DIRECT_URL также должен указывать на Direct Connection (порт 5432)
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
