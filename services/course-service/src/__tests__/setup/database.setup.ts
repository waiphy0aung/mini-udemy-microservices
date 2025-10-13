import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { randomBytes } from "crypto";

const generateDatabaseUrl = () => {
  const schema = `test_${randomBytes(8).toString('hex')}`;
  const baseUrl = process.env.DATABASE_URL || `postgresql://course_service:course_password@localhost:5434/course_service`;
  const url = new URL(baseUrl);
  url.searchParams.set('schema', schema)
  return url.toString();
};

export const testDatabaseUrl = generateDatabaseUrl();
process.env.DATABASE_URL = testDatabaseUrl;

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: testDatabaseUrl,
    },
  },
  log: process.env.LOG_LEVEL === 'debug' ? ['query', 'error', 'warn'] : ['error'],
});

export const setupTestDatabase = async () => {
  execSync('npx prisma db push --skip-generate', {
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl
    },
    stdio: 'ignore'
  });

  return prisma;
};

export const teardownTestDatabase = async () => {
  // Drop test schema
  const url = new URL(testDatabaseUrl);
  const schema = url.searchParams.get('schema');

  if (schema && schema.startsWith('test_')) {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  }

  await prisma.$disconnect();
};

export const clearDatabase = async () => {
  const tables = ['enrollments', 'lessons', 'sections', 'courses', 'categories'];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
  }
};
