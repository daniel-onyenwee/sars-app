import type { Restorer } from "../../types.js"

const restorer: Restorer<"CourseClashAttendance", "INSERT" | "UPDATE" | "DELETE"> = async ({ dbClient, action, beforeImage, afterImage }) => {
    if (action == "INSERT") {
        if (!afterImage) return

        let courseClashAttendancesCount = await dbClient.courseClashAttendance.count({
            where: {
                id: afterImage.id
            }
        })

        if (courseClashAttendancesCount > 0) {
            await dbClient.courseClashAttendance.delete({
                where: {
                    id: afterImage.id
                }
            })
        }
    } else if (action == "UPDATE") {
        if (!beforeImage) return

        let courseClashAttendancesCount = await dbClient.courseClashAttendance.count({
            where: {
                id: beforeImage.id
            }
        })

        if (courseClashAttendancesCount <= 0) return

        let { metadata, ...otherData } = beforeImage
        await dbClient.courseClashAttendance.update({
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
        await dbClient.courseClashAttendance.upsert({
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