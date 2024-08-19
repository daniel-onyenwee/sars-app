import { Postgres, type PostgresInstance, type PostgresInstanceOptions } from "postgres-mini"
import appdataPath from "appdata-path";
const { getAppDataPath } = appdataPath;
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

type ExcludeOptions = "persistent" | "createPostgresUser" | "postgresFlags" | "initdbFlags" | "user"

type DatabaseOptions = Partial<Omit<PostgresInstanceOptions, ExcludeOptions>>

const __dirname = dirname(fileURLToPath(import.meta.url))

async function Database(options: DatabaseOptions = {}): Promise<PostgresInstance> {
    const {
        password = "password",
        overwriteDatabaseDir = false,
        databaseDir = getAppDataPath("sars-data/db"),
        port,
        onError = console.error,
        onLog = console.log
    } = options

    const dbName = "sars-db"
    const pgInstance = await Postgres.create(null, {
        databaseDir,
        password,
        overwriteDatabaseDir,
        port,
        onError,
        onLog
    })
    const dataDefinitionSQLQuery = await readFile(join(__dirname, "../", "utils/query.sql"), "utf8")

    if (!existsSync(databaseDir)) {
        await pgInstance.initialize()
    }

    if (overwriteDatabaseDir) {
        await pgInstance.initialize()
    }

    await pgInstance.start()

    let isDatabasePresent = await pgInstance.hasDatabase(dbName)

    if (!isDatabasePresent) {
        await pgInstance.createDatabase(dbName)
    }

    await pgInstance.query(dataDefinitionSQLQuery, [], dbName)

    return pgInstance
}

export default Database;

export {
    Postgres
}