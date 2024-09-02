import type { Restorer } from "../../types.js"

const restorer: Restorer<"AttendanceRegisterLecturer", "INSERT" | "UPDATE" | "DELETE"> = async ({ dbClient, action, beforeImage, afterImage }) => {
    if (action == "INSERT") {
        if (!afterImage) return

        let attendanceRegisterLecturersCount = await dbClient.attendanceRegisterLecturer.count({
            where: {
                id: afterImage.id
            }
        })

        if (attendanceRegisterLecturersCount > 0) {
            await dbClient.attendanceRegisterLecturer.delete({
                where: {
                    id: afterImage.id
                }
            })
        }
    } else if (action == "UPDATE") {
        if (!beforeImage) return

        let attendanceRegisterLecturersCount = await dbClient.attendanceRegisterLecturer.count({
            where: {
                id: beforeImage.id
            }
        })

        if (attendanceRegisterLecturersCount <= 0) return

        let { metadata, ...otherData } = beforeImage
        await dbClient.attendanceRegisterLecturer.update({
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
        await dbClient.attendanceRegisterLecturer.upsert({
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