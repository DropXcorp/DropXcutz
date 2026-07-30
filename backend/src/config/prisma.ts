import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString || !/^postgres(ql)?:\/\//.test(connectionString)) {
  throw new Error("DATABASE_URL must be a direct PostgreSQL connection string.");
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
