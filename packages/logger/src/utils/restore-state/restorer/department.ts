import type { Restorer } from "../../types.js"

const restorer: Restorer<"Department", "INSERT" | "UPDATE" | "DELETE"> = async ({ dbClient, action, beforeImage, afterImage }) => {
    if (action == "INSERT") {
        if (!afterImage) return

        let departmentsCount = await dbClient.department.count({
            where: {
                id: afterImage.id
            }
        })

        if (departmentsCount > 0) {
            await dbClient.department.delete({
                where: {
                    id: afterImage.id
                }
            })
        }
    } else if (action == "UPDATE") {
        if (!beforeImage) return

        let departmentsCount = await dbClient.department.count({
            where: {
                id: beforeImage.id
            }
        })

        if (departmentsCount <= 0) return

        let { metadata, ...otherData } = beforeImage
        await dbClient.department.update({
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
        await dbClient.department.upsert({
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