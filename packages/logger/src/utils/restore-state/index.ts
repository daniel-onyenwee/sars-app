import { PrismaClient } from "@prisma/client"
import { tableModelName } from "../table-model-name.js"
import { Models, Tables } from "../types.js"
import Restorers from "./restorer/index.js"

export async function restoreState(loggerId: string, dbClient: PrismaClient) {
    let logState = await dbClient.logState.findFirst({
        select: {
            mode: true
        },
        orderBy: {
            setAt: "desc"
        }
    })

    if (!logState) {
        return
    }

    if (logState.mode == "SAVE") {
        return
    }

    let lastSaveState = await dbClient.logState.findFirst({
        select: {
            setAt: true
        },
        where: {
            mode: "SAVE"
        },
        orderBy: {
            setAt: "desc"
        }
    })

    if (!lastSaveState) {
        throw new Error("No saved system state")
    }

    if (logState.mode == "APPLY") {
        await dbClient.logState.create({
            data: { mode: "UNDO", loggerId }
        })
    }

    let logEntries = await dbClient.logEntry.findMany({
        select: {
            action: true,
            afterImage: true,
            beforeImage: true,
            table: true,
            id: true
        },
        where: {
            createdAt: {
                gt: lastSaveState.setAt
            }
        }
    })

    if (logEntries.length == 0) {
        await dbClient.logState.create({
            data: { mode: "SAVE", loggerId }
        })
        return
    }

    let logEntriesToDelete: string[] = []

    for (let entry of logEntries) {
        let restorerName = tableModelName(entry.table as Tables)

        if (!restorerName || !(restorerName in Restorers)) {
            continue
        }

        let restorer = Restorers[restorerName] as any

        await restorer({
            dbClient,
            model: restorerName,
            action: entry.action,
            beforeImage: entry.beforeImage,
            afterImage: entry.afterImage
        })

        logEntriesToDelete.push(entry.id)
    }

    await dbClient.logEntry.deleteMany({
        where: {
            id: {
                in: logEntriesToDelete
            }
        }
    })

    await dbClient.logState.create({
        data: { mode: "SAVE", loggerId }
    })
}