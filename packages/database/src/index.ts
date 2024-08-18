import { Postgres, type PostgresInstance } from "postgres-mini"
import appdataPath from "appdata-path";
const { getAppDataPath } = appdataPath;
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"

async function Database(password: string = "password"): Promise<PostgresInstance> {
    const databaseDir = getAppDataPath("sars-data/db")
    const dbName = "sars-db"
    const pgInstance = await Postgres.create(null, { databaseDir, password })
    const dataDefinitionSQLQuery = await readFile("./utils/query.sql", "utf8")

    if (!existsSync(databaseDir)) {
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

Database("password123")