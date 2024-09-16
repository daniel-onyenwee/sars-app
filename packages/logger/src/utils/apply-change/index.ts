import { $Enums, Prisma, PrismaClient } from "@prisma/client"
import Appliers from "./appliers/index.js"
import type { Tables } from "../types.ts"
import { isBefore, isEqual } from "date-fns"
import { tableModelName } from "../table-model-name.js"

interface LogEntry {
    id: string
    action: $Enums.LogAction
    table: string
    createdAt: Date | string
    loggerId: string
    beforeImage: Prisma.JsonValue
    afterImage: Prisma.JsonValue
}

interface LogContributor {
    loggerId: string
    lastEntryAt: Date | string
}

export async function applyChange(loggerId: string, dbClient: PrismaClient, contributors: LogContributor[], changes: LogEntry[]) {
    let logState = await dbClient.logState.findFirst({
        select: {
            mode: true
        },
        orderBy: {
            setAt: "desc"
        }
    })

    if (!logState) {
        await dbClient.logState.create({
            data: { mode: "SAVE", loggerId }
        })
    }

    if (logState && logState.mode != "SAVE") {
        throw new Error("No saved system state")
    }

    let contributorMap = new Map(contributors.map(({ loggerId, ...otherData }) => [loggerId, { ...otherData, loggerId }]))

    let oldContributor: ReturnType<typeof contributorMap.get> = undefined

    let changeMade = false

    for (let change of changes) {
        let applierName = tableModelName(change.table as Tables)

        if (!applierName || !(applierName in Appliers)) {
            continue
        }

        let changeApplier = Appliers[applierName][change.action] as any

        if (!changeApplier) {
            continue
        }

        let contributor = contributorMap.get(change.loggerId)

        if (!contributor) {
            contributor = {
                lastEntryAt: new Date("1970-01-01T00:00:00.000Z"),
                loggerId: change.loggerId
            }
            contributorMap.set(change.loggerId, contributor)
        }

        if (isBefore(change.createdAt, contributor.lastEntryAt) || isEqual(change.createdAt, contributor.lastEntryAt)) {
            continue
        }

        if (!oldContributor || oldContributor.loggerId != contributor.loggerId) {
            await dbClient.logState.create({
                data: {
                    mode: "APPLY",
                    loggerId: change.loggerId
                }
            })
        }

        try {
            await changeApplier({
                dbClient,
                model: applierName,
                action: change.action,
                beforeImage: change.beforeImage,
                afterImage: change.afterImage
            })
            contributor.lastEntryAt = new Date()
            oldContributor = contributor
            changeMade = true
        } catch (error: any) {
            await dbClient.logState.create({
                data: { mode: "UNDO", loggerId }
            })
            throw new Error(`${applierName} [${change.action}] ${error.message}`)
        }
    }

    for (let contributor of contributorMap.values()) {
        await dbClient.logContributor.upsert({
            where: {
                loggerId: contributor.loggerId
            },
            create: {
                loggerId: contributor.loggerId,
                lastEntryAt: contributor.lastEntryAt
            },
            update: {
                lastEntryAt: contributor.lastEntryAt
            }
        })
    }

    if (!changeMade) return

    await dbClient.logState.create({
        data: { mode: "SAVE", loggerId }
    })
}