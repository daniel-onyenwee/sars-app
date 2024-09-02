import Conf from "conf"
import { randomBytes } from "node:crypto"
import { machineIdSync } from "node-machine-id"
import { generatePassword } from "./generate-password.js"
import { join } from "node:path"
import { appDataDirParse } from "./app-data-dir-parse.js"
import { InvalidOptionArgumentError } from "@commander-js/extra-typings"

const dbPassword = generatePassword(16)

const schema = {
    db: {
        type: "object",
        properties: {
            password: {
                type: "string",
            }
        },
        required: [
            "password"
        ],
        default: {
            password: dbPassword
        }
    },
    webapp: {
        type: "object",
        default: {
            accessToken: randomBytes(16).toString("hex"),
            refreshToken: randomBytes(32).toString("hex"),
            sessionKey: randomBytes(8).toString("hex")
        },
        properties: {
            accessToken: {
                type: "string",
            },
            refreshToken: {
                type: "string",
            },
            sessionKey: {
                type: "string",
            }
        },
        required: [
            "accessToken",
            "refreshToken",
            "sessionKey"
        ]
    },
    admin: {
        type: "object",
        properties: {
            password: {
                type: "string"
            },
            loggerId: {
                type: "string"
            }
        },
        default: {
            password: "password",
            loggerId: machineIdSync()
        },
        required: [
            "password",
            "loggerId"
        ]
    }
}

export async function setupConfig(appDataDir: string) {
    try {
        await appDataDirParse(appDataDir)
    } catch (error) {
        if (error instanceof InvalidOptionArgumentError) {
            console.log(`error: ${error.message}`)
            return null
        }
    }

    const config = new Conf({
        projectVersion: "1.0.0",
        cwd: join(appDataDir, "engine"),
        schema
    })

    return config
}