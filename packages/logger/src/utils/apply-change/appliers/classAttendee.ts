import type { Applier } from "../../types.js"

const INSERT: Applier<"ClassAttendee", "INSERT"> = async ({ dbClient, afterImage }) => {
    let classAttendancesCount = await dbClient.classAttendance.count({
        where: {
            id: afterImage.classAttendanceId
        }
    })

    if (classAttendancesCount <= 0) {
        throw new Error("Class attendance not found")
    }

    let attendanceRegisterStudentsCount = await dbClient.attendanceRegisterStudent.count({
        where: {
            id: afterImage.attendanceRegisterStudentId,
            attendanceRegister: {
                classAttendances: {
                    some: {
                        id: afterImage.classAttendanceId
                    }
                }
            }
        }
    })

    if (attendanceRegisterStudentsCount <= 0) {
        throw new Error("Attendance register student not found")
    }

    await dbClient.classAttendee.create({
        data: {
            id: afterImage.id,
            classAttendanceId: afterImage.classAttendanceId,
            attendanceRegisterStudentId: afterImage.attendanceRegisterStudentId,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        }
    })
}

const UPDATE: Applier<"ClassAttendee", "UPDATE"> = async ({ dbClient, afterImage }) => {
    let classAttendancesCount = await dbClient.classAttendance.count({
        where: {
            id: afterImage.classAttendanceId
        }
    })

    if (classAttendancesCount <= 0) {
        throw new Error("Class attendance not found")
    }

    let attendanceRegisterStudentsCount = await dbClient.attendanceRegisterStudent.count({
        where: {
            id: afterImage.attendanceRegisterStudentId,
            attendanceRegister: {
                classAttendances: {
                    some: {
                        id: afterImage.classAttendanceId
                    }
                }
            }
        }
    })

    if (attendanceRegisterStudentsCount <= 0) {
        throw new Error("Attendance register student not found")
    }

    await dbClient.classAttendee.update({
        where: {
            id: afterImage.id,
        },
        data: {
            classAttendanceId: afterImage.classAttendanceId,
            attendanceRegisterStudentId: afterImage.attendanceRegisterStudentId,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        }
    })
}

const DELETE: Applier<"ClassAttendee", "DELETE"> = async ({ dbClient, beforeImage }) => {
    const classAttendeesCount = await dbClient.classAttendee.count({
        where: {
            id: beforeImage.id
        }
    })

    if (classAttendeesCount <= 0) {
        throw new Error("Class attendee not found")
    }

    await dbClient.classAttendee.delete({
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