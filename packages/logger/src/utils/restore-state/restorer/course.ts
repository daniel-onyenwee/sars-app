import type { Restorer } from "../../types.js"

const restorer: Restorer<"Course", "INSERT" | "UPDATE" | "DELETE"> = async ({ dbClient, action, beforeImage, afterImage }) => {
    if (action == "INSERT") {
        if (!afterImage) return

        let coursesCount = await dbClient.course.count({
            where: {
                id: afterImage.id
            }
        })

        if (coursesCount > 0) {
            await dbClient.course.delete({
                where: {
                    id: afterImage.id
                }
            })
        }
    } else if (action == "UPDATE") {
        if (!beforeImage) return

        let coursesCount = await dbClient.course.count({
            where: {
                id: beforeImage.id
            }
        })

        if (coursesCount <= 0) return

        let { metadata, ...otherData } = beforeImage
        await dbClient.course.update({
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
        await dbClient.course.upsert({
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