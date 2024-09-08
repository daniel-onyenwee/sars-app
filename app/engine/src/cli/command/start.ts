import { Command } from "@commander-js/extra-typings"
import { setupConfig, setupServer, setupDb } from "../../utils/index.js"
import { type PostgresInstance } from "@sars/database"
import Logger from "@sars/logger"
import { findFreePorts } from "find-free-ports"

const startAction: Parameters<typeof startCommand.action>[0] = async function ({ appDataDir }) {
    let config = await setupConfig(appDataDir)

    if (!config) {
        console.log("error: user configuration request failed")
        return
    }

    const dbName = "sars-db"

    let pg: PostgresInstance | null = null

    try {
        console.log("Starting database")
        pg = await setupDb(appDataDir, config.get("db.password"))
    } catch (error) {
        console.log("error: database failed to start")
        return
    }

    let pgClient = pg.client(dbName)

    let databaseUrl = `postgresql://${pgClient.user}:${pgClient.password}@${pgClient.host}:${pgClient.port}/${pgClient.database}?schema=public`,
        accessToken = config.get("webapp.accessToken"),
        refreshToken = config.get("webapp.refreshToken"),
        sessionKey = config.get("webapp.sessionKey"),
        adminPassword = config.get("admin.password")

    console.log(`Started database at ${databaseUrl}`)

    try {
        console.log("Restoring system state")
        let logger = new Logger(config.get("admin.loggerId"), databaseUrl)
        await logger.checkout()
        console.log("System state restored")
    } catch (error) {
        console.log("error: system state restoration failed")
        return
    }

    const [port] = await findFreePorts(1)

    try {
        console.log("Starting server")
        await setupServer({
            DATABASE_URL: databaseUrl,
            ACCESS_TOKEN_SECRET: accessToken as string,
            ADMIN_PASSWORD: adminPassword as string,
            REFRESH_TOKEN_SECRET: refreshToken as string,
            PUBLIC_SESSION_SECRET_KEY: sessionKey as string
        }, port)
        console.log(`Started server at http://localhost:${port}`)
    } catch (error) {
        console.log("error: server failed to start")
        return
    }
}

export const startCommand = new Command("start")
    .description("Start the SARs engine.")
    .requiredOption("-a, --app-data-dir <dir>", "SARs desktop app app-data directory.")
    .alias("s")
    .action(startAction)
