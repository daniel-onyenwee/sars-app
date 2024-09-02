import type { Restorer } from "../../types.js"

const restorer: Restorer<"ClassAttendance", "INSERT" | "UPDATE" | "DELETE"> = async ({ dbClient, action, beforeImage, afterImage }) => {
    if (action == "INSERT") {
        if (!afterImage) return

        let classAttendancesCount = await dbClient.classAttendance.count({
            where: {
                id: afterImage.id
            }
        })

        if (classAttendancesCount > 0) {
            await dbClient.classAttendance.delete({
                where: {
                    id: afterImage.id
                }
            })
        }
    } else if (action == "UPDATE") {
        if (!beforeImage) return

        let classAttendancesCount = await dbClient.classAttendance.count({
            where: {
                id: beforeImage.id
            }
        })

        if (classAttendancesCount <= 0) return

        let { metadata, ...otherData } = beforeImage
        await dbClient.classAttendance.update({
            where: {
                id: beforeImage.id
            },
            data: {
                ...otherData,
                metadata: metadata as any
            }
        })
    } else if (action == "DELETE") {
        if (!beforeImage) return

        let { metadata, ...otherData } = beforeImage
        await dbClient.classAttendance.upsert({
            where: {
                id: beforeImage.id
            },
            create: {
                ...otherData,
                metadata: metadata as any
            },
            update: {}
        })
    }
}

export default restorer