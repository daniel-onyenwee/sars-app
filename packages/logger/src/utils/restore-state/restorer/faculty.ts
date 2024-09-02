import type { Restorer } from "../../types.js"

const restorer: Restorer<"Faculty", "INSERT" | "UPDATE" | "DELETE"> = async ({ dbClient, action, beforeImage, afterImage }) => {
    if (action == "INSERT") {
        if (!afterImage) return

        let facultiesCount = await dbClient.faculty.count({
            where: {
                id: afterImage.id
            }
        })

        if (facultiesCount > 0) {
            await dbClient.faculty.delete({
                where: {
                    id: afterImage.id
                }
            })
        }
    } else if (action == "UPDATE") {
        if (!beforeImage) return

        let facultiesCount = await dbClient.faculty.count({
            where: {
                id: beforeImage.id
            }
        })

        if (facultiesCount <= 0) return

        let { metadata, ...otherData } = beforeImage
        await dbClient.faculty.update({
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
        await dbClient.faculty.upsert({
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