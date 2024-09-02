import { differenceInHours } from "date-fns"
import type { Applier } from "../../types.js"

const INSERT: Applier<"ClassAttendance", "INSERT"> = async ({ dbClient, afterImage }) => {
    if (differenceInHours(afterImage.endTime, afterImage.startTime) > 2) {
        throw new Error("Class exceeded two hour mark")
    }

    let attendanceRegister = await dbClient.attendanceRegister.findUnique({
        where: {
            id: afterImage.attendanceRegisterId,
        },
        select: {
            session: true,
            courseId: true
        }
    })

    if (!attendanceRegister) {
        throw new Error("Attendance register not found")
    }

    // Check if the attendance register lecturer exist
    let attendanceRegisterLecturersCount = await dbClient.attendanceRegisterLecturer.count({
        where: {
            id: afterImage.attendanceRegisterLecturerId,
            attendanceRegisterId: afterImage.attendanceRegisterId
        }
    })

    if (attendanceRegisterLecturersCount <= 0) {
        throw new Error("Attendance register lecturer not found")
    }

    // Check if a class attendance with same property already exist
    const classAttendanceCountByAttendanceRegisterIdAttendanceRegisterLecturerIdDate = await dbClient.classAttendance.count({
        where: {
            date: afterImage.date,
            attendanceRegisterId: afterImage.attendanceRegisterId,
            OR: [
                {
                    startTime: {
                        lte: afterImage.startTime
                    },
                    endTime: {
                        gt: afterImage.endTime
                    }
                },
                {
                    startTime: {
                        lte: afterImage.startTime
                    },
                    endTime: {
                        gt: afterImage.startTime
                    }
                },
                {
                    startTime: {
                        lte: afterImage.endTime
                    },
                    endTime: {
                        gt: afterImage.endTime
                    }
                }
            ]
        }
    })

    if (classAttendanceCountByAttendanceRegisterIdAttendanceRegisterLecturerIdDate > 0) {
        throw new Error("Class attendance already exist")
    }

    await dbClient.classAttendance.create({
        data: {
            id: afterImage.id,
            attendanceRegisterId: afterImage.attendanceRegisterId,
            attendanceRegisterLecturerId: afterImage.attendanceRegisterLecturerId,
            date: afterImage.date,
            startTime: afterImage.startTime,
            endTime: afterImage.endTime,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        },
    })
}

const UPDATE: Applier<"ClassAttendance", "UPDATE"> = async ({ dbClient, afterImage }) => {
    if (differenceInHours(afterImage.endTime, afterImage.startTime) > 2) {
        throw new Error("Class exceeded two hour mark")
    }

    let attendanceRegister = await dbClient.attendanceRegister.findUnique({
        where: {
            id: afterImage.attendanceRegisterId,
        },
        select: {
            session: true,
            courseId: true
        }
    })

    if (!attendanceRegister) {
        throw new Error("Attendance register not found")
    }

    // Check if the attendance register lecturer exist
    let attendanceRegisterLecturersCount = await dbClient.attendanceRegisterLecturer.count({
        where: {
            id: afterImage.attendanceRegisterLecturerId,
            attendanceRegisterId: afterImage.attendanceRegisterId
        }
    })

    if (attendanceRegisterLecturersCount <= 0) {
        throw new Error("Attendance register lecturer not found")
    }

    // Check if a class attendance with same property already exist
    const classAttendanceCountByAttendanceRegisterIdAttendanceRegisterLecturerIdDate = await dbClient.classAttendance.count({
        where: {
            id: {
                not: afterImage.id
            },
            date: afterImage.date,
            attendanceRegisterId: afterImage.attendanceRegisterId,
            OR: [
                {
                    startTime: {
                        lte: afterImage.startTime
                    },
                    endTime: {
                        gt: afterImage.endTime
                    }
                },
                {
                    startTime: {
                        lte: afterImage.startTime
                    },
                    endTime: {
                        gt: afterImage.startTime
                    }
                },
                {
                    startTime: {
                        lte: afterImage.endTime
                    },
                    endTime: {
                        gt: afterImage.endTime
                    }
                }
            ]
        }
    })

    if (classAttendanceCountByAttendanceRegisterIdAttendanceRegisterLecturerIdDate > 0) {
        throw new Error("Class attendance already exist")
    }

    await dbClient.classAttendance.update({
        where: {
            id: afterImage.id,
        },
        data: {
            attendanceRegisterId: afterImage.attendanceRegisterId,
            attendanceRegisterLecturerId: afterImage.attendanceRegisterLecturerId,
            date: afterImage.date,
            startTime: afterImage.startTime,
            endTime: afterImage.endTime,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        },
    })
}

const DELETE: Applier<"ClassAttendance", "DELETE"> = async ({ dbClient, beforeImage }) => {
    const classAttendancesCount = await dbClient.classAttendance.count({
        where: {
            id: beforeImage.id
        }
    })

    if (classAttendancesCount <= 0) {
        throw new Error("Class attendance not found")
    }

    await dbClient.classAttendance.delete({
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