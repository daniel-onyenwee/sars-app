import type { Applier } from "../../types.js"

const INSERT: Applier<"AttendanceRegisterStudent", "INSERT"> = async ({ dbClient, afterImage }) => {
    let attendanceRegistersCount = await dbClient.attendanceRegister.count({
        where: {
            id: afterImage.attendanceRegisterId
        }
    })

    if (attendanceRegistersCount <= 0) {
        throw new Error("Attendance register not found")
    }

    let studentsCount = await dbClient.student.count({
        where: {
            id: afterImage.studentId
        }
    })

    if (studentsCount <= 0) {
        throw new Error("Student not found")
    }

    await dbClient.attendanceRegisterStudent.create({
        data: {
            id: afterImage.id,
            studentId: afterImage.studentId,
            attendanceRegisterId: afterImage.attendanceRegisterId,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        }
    })
}

const UPDATE: Applier<"AttendanceRegisterStudent", "UPDATE"> = async ({ dbClient, afterImage }) => {
    let attendanceRegistersCount = await dbClient.attendanceRegister.count({
        where: {
            id: afterImage.attendanceRegisterId
        }
    })

    if (attendanceRegistersCount <= 0) {
        throw new Error("Attendance register not found")
    }

    let studentsCount = await dbClient.student.count({
        where: {
            id: afterImage.studentId
        }
    })

    if (studentsCount <= 0) {
        throw new Error("Student not found")
    }

    await dbClient.attendanceRegisterStudent.update({
        where: {
            id: afterImage.id
        },
        data: {
            studentId: afterImage.studentId,
            attendanceRegisterId: afterImage.attendanceRegisterId,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        }
    })
}

const DELETE: Applier<"AttendanceRegisterStudent", "DELETE"> = async ({ dbClient, beforeImage }) => {
    const attendanceRegisterStudentsCount = await dbClient.attendanceRegisterStudent.count({
        where: {
            id: beforeImage.id
        }
    })

    if (attendanceRegisterStudentsCount <= 0) {
        throw new Error("Attendance register student not found")
    }

    await dbClient.attendanceRegisterStudent.delete({
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