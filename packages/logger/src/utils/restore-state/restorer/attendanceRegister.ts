import type { Restorer } from "../../types.js"

const restorer: Restorer<"AttendanceRegister", "INSERT" | "UPDATE" | "DELETE"> = async ({ dbClient, action, beforeImage, afterImage }) => {
    if (action == "INSERT") {
        if (!afterImage) return

        let attendanceRegistersCount = await dbClient.attendanceRegister.count({
            where: {
                id: afterImage.id
            }
        })

        if (attendanceRegistersCount > 0) {
            await dbClient.attendanceRegister.delete({
                where: {
                    id: afterImage.id
                }
            })
        }
    } else if (action == "UPDATE") {
        if (!beforeImage) return

        let attendanceRegistersCount = await dbClient.attendanceRegister.count({
            where: {
                id: beforeImage.id
            }
        })

        if (attendanceRegistersCount <= 0) return

        let { metadata, decision, ...otherData } = beforeImage
        await dbClient.attendanceRegister.update({
            where: {
                id: beforeImage.id
            },
            data: {
                ...otherData,
                metadata: metadata as any,
                decision: decision as any
            }
        })
    } else if (action == "DELETE") {
        if (!beforeImage) return

        let { metadata, decision, ...otherData } = beforeImage
        await dbClient.attendanceRegister.upsert({
            where: {
                id: beforeImage.id
            },
            create: {
                ...otherData,
                metadata: metadata as any,
                decision: decision as any
            },
            update: {}
        })
    }
}

export default restorer