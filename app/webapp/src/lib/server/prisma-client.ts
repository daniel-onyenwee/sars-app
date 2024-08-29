import { env } from "$env/dynamic/private"
import type { PrismaClient as PrismaClientType } from "@prisma/client"
import { createRequire } from "module"

const require = createRequire(import.meta.url ?? __filename);

const { PrismaClient: PrismaClientImpl } = require('@prisma/client');

class PrismaClient extends (PrismaClientImpl as typeof PrismaClientType) { }

export const prismaClient = new PrismaClient({ datasourceUrl: env.DATABASE_URL })