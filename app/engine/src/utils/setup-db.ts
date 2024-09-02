import Database, { type PostgresInstance } from "@sars/database"
import { join } from "path"

let pg: PostgresInstance | null = null

export async function setupDb(appDataDir: string, dbPassword: string) {
    const dbName = "sars-db"

    if (pg) {
        return pg
    }

    pg = await Database({
        databaseDir: join(appDataDir, "engine/db"),
        dbName,
        password: dbPassword,
        onLog(_) { },
        onError(_) { },
    })

    return pg
}