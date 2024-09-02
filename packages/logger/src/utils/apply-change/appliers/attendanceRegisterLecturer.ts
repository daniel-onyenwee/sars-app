import type { Applier } from "../../types.js"

const INSERT: Applier<"AttendanceRegisterLecturer", "INSERT"> = async ({ dbClient, afterImage }) => {
    let attendanceRegistersCount = await dbClient.attendanceRegister.count({
        where: {
            id: afterImage.attendanceRegisterId
        }
    })

    if (attendanceRegistersCount <= 0) {
        throw new Error("Attendance register not found")
    }

    let lecturersCount = await dbClient.lecturer.count({
        where: {
            id: afterImage.lecturerId
        }
    })

    if (lecturersCount <= 0) {
        throw new Error("Lecturer not found")
    }

    await dbClient.attendanceRegisterLecturer.create({
        data: {
            id: afterImage.id,
            lecturerId: afterImage.lecturerId,
            attendanceRegisterId: afterImage.attendanceRegisterId,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        }
    })
}

const UPDATE: Applier<"AttendanceRegisterLecturer", "UPDATE"> = async ({ dbClient, beforeImage, afterImage }) => {
    let attendanceRegistersCount = await dbClient.attendanceRegister.count({
        where: {
            id: afterImage.attendanceRegisterId
        }
    })

    if (attendanceRegistersCount <= 0) {
        throw new Error("Attendance register not found")
    }

    let lecturersCount = await dbClient.lecturer.count({
        where: {
            id: afterImage.lecturerId
        }
    })

    if (lecturersCount <= 0) {
        throw new Error("Lecturer not found")
    }

    await dbClient.attendanceRegisterLecturer.update({
        where: {
            id: afterImage.id
        },
        data: {
            lecturerId: afterImage.lecturerId,
            attendanceRegisterId: afterImage.attendanceRegisterId,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        }
    })
}

const DELETE: Applier<"AttendanceRegisterLecturer", "DELETE"> = async ({ dbClient, beforeImage }) => {
    const attendanceRegisterLecturersCount = await dbClient.attendanceRegisterLecturer.count({
        where: {
            id: beforeImage.id
        }
    })

    if (attendanceRegisterLecturersCount <= 0) {
        throw new Error("Attendance register lecturer not found")
    }

    await dbClient.attendanceRegisterLecturer.delete({
        where: {
            id: beforeImage.id
        }
    })
}

export default {
    INSERT,
    UPDATE,
    DELETE
}