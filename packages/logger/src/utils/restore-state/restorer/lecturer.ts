import type { Restorer } from "../../types.js"

const restorer: Restorer<"Lecturer", "INSERT" | "UPDATE" | "DELETE"> = async ({ dbClient, action, beforeImage, afterImage }) => {
    if (action == "INSERT") {
        if (!afterImage) return

        let lecturersCount = await dbClient.lecturer.count({
            where: {
                id: afterImage.id
            }
        })

        if (lecturersCount > 0) {
            await dbClient.lecturer.delete({
                where: {
                    id: afterImage.id
                }
            })
        }
    } else if (action == "UPDATE") {
        if (!beforeImage) return

        let lecturersCount = await dbClient.lecturer.count({
            where: {
                id: beforeImage.id
            }
        })

        if (lecturersCount <= 0) return

        let { metadata, ...otherData } = beforeImage
        await dbClient.lecturer.update({
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
        await dbClient.lecturer.upsert({
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