// eslint-disable-next-line @typescript-eslint/no-var-requires
const PrismaPkg = (() => {
  try {
    return require("@prisma/client");
  } catch (_) {
    return require("../../node_modules/.prisma/client");
  }
})();

type PrismaClient = InstanceType<typeof PrismaPkg.PrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const resolveDbUrl = () =>
  process.env.DATABASE_URL || process.env.COURSE_DATABASE_URL || undefined;

const prisma = (globalForPrisma.prisma ?? new PrismaPkg.PrismaClient({
  log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  datasources: {
    db: {
      url: resolveDbUrl(),
    },
  },
})) as PrismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
