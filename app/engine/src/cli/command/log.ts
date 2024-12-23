import { Command } from "@commander-js/extra-typings"
import Logger from "@sars/logger"
import { existsSync, readFileSync } from "node:fs"
import { extname } from "node:path"

const logAction: Parameters<typeof logCommand.action>[0] = async function ({ databaseUrl, loggerId, output, apply }) {
    let logger = new Logger(loggerId, databaseUrl)

    if (output) {
        await logger.output("data", output)
        console.log(`Successfully saved log changes`)
        return
    }

    if (!apply) {
        console.log(JSON.stringify(await logger.entries(), null, 2))
        return
    }

    if (!existsSync(apply)) {
        console.log("error: log file not found")
        return
    }

    let logData: Parameters<typeof logger.apply>[0]

    try {
        logData = JSON.parse(readFileSync(apply, "utf8"))
        if (extname(apply) != ".log") {
            throw new Error()
        }
    } catch {
        console.log("error: invalid log file found")
        return
    }

    try {
        await logger.checkout()
        await logger.apply(logData)
        console.log("Successfully applied log changes")
    } catch (error) {
        console.log("error: log changes failed to apply")
    }
}

export const logCommand = new Command("log")
    .description("Show, apply and output the SARs engine log changes.")
    .requiredOption("-d, --database-url <url>", "SARs postgres database url.")
    .requiredOption("-i, --logger-id <id>", "Unique identification of user.")
    .option("-e, --entries", "Show all the log entries.")
    .option("-o, --output <path>", "Save log changes to path.")
    .option("-a, --apply <path>", "Apply log changes from path")
    .alias("l")
    .action(logAction)