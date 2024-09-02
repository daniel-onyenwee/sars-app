import { Command } from "@commander-js/extra-typings"
import { setupConfig } from "../../utils/index.js"

const configAction: Parameters<typeof configCommand.action>[0] = async function (key, value, { appDataDir, password, reset }) {
    let config = await setupConfig(appDataDir)

    if (!config) {
        console.log("error: user configuration request failed")
        return
    }

    if (config.get("admin.password") != password) {
        console.log("error: incorrect admin password")
        return
    }

    if (!key && !value) {
        if (reset) {
            config.reset("webapp", "admin")
        }

        console.log(JSON.parse(JSON.stringify(config.store, null, 2)))
    } else if (key) {
        if (!config.has(key)) {
            console.log(`error: config option '${key}' not found`)
            return
        }

        if (reset) {
            if (key.includes("db") || key == "admin.loggerId") {
                console.log(config.get(key))
                return
            }

            config.reset(key as any)
            console.log(config.get(key))
            return
        }

        if (!value) {
            console.log(config.get(key))
            return
        }

        if (key.includes("db") || key == "admin.loggerId") {
            console.log(`error: config option '${key}' can't be modified`)
            return
        }

        try {
            config.set(key as any, value)
            console.log(value)
        } catch (error: any) {
            if (error instanceof Error) {
                const unwantedStr = "Config schema violation: "
                console.log("error: config option " + error.message.replace(unwantedStr, String()).replaceAll("`", "'"))
            }
        }
    }
}

export const configCommand = new Command("config")
    .description("COnfig the SARs engine.")
    .argument("[key]", "Config key to get or update. e.g webapp.sessionKey")
    .argument("[value]", "Config value to update with.")
    .requiredOption("-a, --app-data-dir <dir>", "SARs desktop app app-data directory.")
    .requiredOption("-p, --password <admin-password>", "SARs engine admin password.The default admin password is 'password', if not changed.")
    .option("-r, --reset", "Reset configuration.")
    .alias("c")
    .action(configAction)
