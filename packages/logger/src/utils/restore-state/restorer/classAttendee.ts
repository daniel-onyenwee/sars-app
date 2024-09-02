import type { Restorer } from "../../types.js"

const restorer: Restorer<"ClassAttendee", "INSERT" | "UPDATE" | "DELETE"> = async ({ dbClient, action, beforeImage, afterImage }) => {
    if (action == "INSERT") {
        if (!afterImage) return

        let classAttendeesCount = await dbClient.classAttendee.count({
            where: {
                id: afterImage.id
            }
        })

        if (classAttendeesCount > 0) {
            await dbClient.classAttendee.delete({
                where: {
                    id: afterImage.id
                }
            })
        }
    } else if (action == "UPDATE") {
        if (!beforeImage) return

        let classAttendeesCount = await dbClient.classAttendee.count({
            where: {
                id: beforeImage.id
            }
        })

        if (classAttendeesCount <= 0) return

        let { metadata, ...otherData } = beforeImage
        await dbClient.classAttendee.update({
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
        await dbClient.classAttendee.upsert({
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