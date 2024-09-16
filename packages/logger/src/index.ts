import { applyChange, dbDefinitionQuery, restoreState } from "./utils/index.js"
import pg from "pg"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { mkdir, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { $Enums, Prisma, PrismaClient } from "@prisma/client"

interface LogEntry {
    id: string;
    action: $Enums.LogAction;
    table: string;
    createdAt: Date | string;
    loggerId: string;
    beforeImage: Prisma.JsonValue;
    afterImage: Prisma.JsonValue;
}

export default class Logger {
    #databaseUrl: string
    #isInitialize: boolean = false
    #loggerId: string
    #client: PrismaClient | null = null

    constructor(loggerId: string, databaseUrl: string) {
        this.#databaseUrl = databaseUrl
        this.#loggerId = loggerId
    }

    async #initialize() {
        let nativeClient = new pg.Client({
            connectionString: this.#databaseUrl
        })

        await nativeClient.connect()
        await nativeClient.query(dbDefinitionQuery(this.#loggerId))
        await nativeClient.end()

        this.#client = new PrismaClient({ datasourceUrl: this.#databaseUrl })

        this.#isInitialize = true
    }

    async apply(logs: LogEntry[]) {
        if (!this.#isInitialize) {
            await this.#initialize()
        }

        if (!this.#client) {
            throw new Error("Database client is inactivate")
        }

        let logContributors = await this.#client.logContributor.findMany({
            select: {
                lastEntryAt: true,
                loggerId: true
            }
        })

        if (logs.length <= 0) {
            return
        }

        await applyChange(this.#loggerId, this.#client, logContributors, logs)
    }

    async checkout() {
        if (!this.#isInitialize) {
            await this.#initialize()
        }

        if (!this.#client) {
            throw new Error("Database client is inactivate")
        }

        await restoreState(this.#loggerId, this.#client)
    }

    async entries() {
        if (!this.#isInitialize) {
            await this.#initialize()
        }

        if (!this.#client) {
            throw new Error("Database client is inactivate")
        }

        return this.#client.logEntry.findMany({
            orderBy: {
                createdAt: "asc"
            }
        })
    }

    async output(path: string = join(dirname(fileURLToPath(import.meta.url)), "data.log")) {
        if (!this.#isInitialize) {
            await this.#initialize()
        }

        if (!this.#client) {
            throw new Error("Database client is inactivate")
        }

        let entries = await this.#client.logEntry.findMany({
            orderBy: {
                createdAt: "asc"
            }
        })

        let data = JSON.stringify(entries, null, 2)

        if (!existsSync(dirname(path))) {
            await mkdir(dirname(path), { recursive: true })
        }

        await writeFile(path, data, { encoding: "utf8" })
    }
}