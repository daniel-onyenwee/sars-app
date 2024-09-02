import type { Restorer } from "../../types.js"

const restorer: Restorer<"Student", "INSERT" | "UPDATE" | "DELETE"> = async ({ dbClient, action, beforeImage, afterImage }) => {
    if (action == "INSERT") {
        if (!afterImage) return

        let studentsCount = await dbClient.student.count({
            where: {
                id: afterImage.id
            }
        })

        if (studentsCount > 0) {
            await dbClient.student.delete({
                where: {
                    id: afterImage.id
                }
            })
        }
    } else if (action == "UPDATE") {
        if (!beforeImage) return

        let studentsCount = await dbClient.student.count({
            where: {
                id: beforeImage.id
            }
        })

        if (studentsCount <= 0) return

        let { metadata, ...otherData } = beforeImage
        await dbClient.student.update({
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
        await dbClient.student.upsert({
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