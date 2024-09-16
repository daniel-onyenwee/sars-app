import Database, { type PostgresInstance } from "@sars/database"
import { exec } from "node:child_process"
import { join } from "node:path"

let pg: PostgresInstance | null = null

async function isDatabaseRunning(databaseDir: string) {
    return await new Promise<boolean>((resolve, reject) => {
        exec(`wmic process where "name='postgres.exe'" get CommandLine`, (err, stdout, stderr) => {
            if (err) {
                reject(err)
                return
            }

            const processes = stdout.split("\n")
            for (let pro of processes) {
                if (pro.includes("-D") && pro.includes(databaseDir)) {
                    resolve(true)
                    return
                }
            }

            resolve(false)
        })
    })
}

export async function setupDb(appDataDir: string, dbPassword: string) {
    const dbName = "sars-db"

    if (pg) {
        return pg
    }

    if (await isDatabaseRunning(join(appDataDir, "Engine/db"))) {
        throw new Error("Database already running with the data directory")
    }

    pg = await Database({
        databaseDir: join(appDataDir, "Engine/db"),
        dbName,
        password: dbPassword,
        onLog(_) { },
        onError(_) { },
    })

    return pg
}