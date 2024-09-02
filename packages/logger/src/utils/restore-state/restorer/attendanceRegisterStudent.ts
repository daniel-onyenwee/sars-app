import type { Restorer } from "../../types.js"

const restorer: Restorer<"AttendanceRegisterStudent", "INSERT" | "UPDATE" | "DELETE"> = async ({ dbClient, action, beforeImage, afterImage }) => {
    if (action == "INSERT") {
        if (!afterImage) return

        let attendanceRegisterStudentsCount = await dbClient.attendanceRegisterStudent.count({
            where: {
                id: afterImage.id
            }
        })

        if (attendanceRegisterStudentsCount > 0) {
            await dbClient.attendanceRegisterStudent.delete({
                where: {
                    id: afterImage.id
                }
            })
        }
    } else if (action == "UPDATE") {
        if (!beforeImage) return

        let attendanceRegisterStudentsCount = await dbClient.attendanceRegisterStudent.count({
            where: {
                id: beforeImage.id
            }
        })

        if (attendanceRegisterStudentsCount <= 0) return

        let { metadata, ...otherData } = beforeImage
        await dbClient.attendanceRegisterStudent.update({
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
        await dbClient.attendanceRegisterStudent.upsert({
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