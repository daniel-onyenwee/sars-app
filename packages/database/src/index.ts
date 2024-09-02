import {
    Postgres,
    type PostgresInstance,
    type PostgresInstanceOptions
} from "postgres-mini"
import appdataPath from "appdata-path"
const { getAppDataPath } = appdataPath
import { dbDefinitionQuery } from "./utils/index.js"
import { existsSync } from "node:fs"

type ExcludeOptions = "persistent" | "createPostgresUser" | "postgresFlags" | "initdbFlags" | "user"

type DatabaseOptions = Partial<Omit<PostgresInstanceOptions & { dbName: string }, ExcludeOptions>>

async function Database(options: DatabaseOptions = {}): Promise<PostgresInstance> {
    const dbName = options.dbName || "sars-db"

    delete options.dbName

    let pgInstanceOptions: Partial<PostgresInstanceOptions> = {
        password: "password",
        overwriteDatabaseDir: false,
        databaseDir: getAppDataPath("sars-data/db"),
        onError: console.error,
        onLog: console.log
    }

    for (const key in options) {
        if (Object(options)[key]) {
            Object(pgInstanceOptions)[key] = Object(options)[key]
        }
    }

    const pgInstance = await Postgres.create(null, pgInstanceOptions)

    if (options.databaseDir && !existsSync(options.databaseDir)) {
        await pgInstance.initialize()
    }

    if (options.overwriteDatabaseDir) {
        await pgInstance.initialize()
    }

    await pgInstance.start()

    let isDatabasePresent = await pgInstance.hasDatabase(dbName)

    if (!isDatabasePresent) {
        await pgInstance.createDatabase(dbName)
    }

    await pgInstance.query(dbDefinitionQuery, [], dbName)

    return pgInstance
}

export default Database;

export {
    Postgres,
    type PostgresInstance
}