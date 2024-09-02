import { attendanceRegisterDecisionExpressionTypeChecker } from "../../attendance-register/index.js"
import type { Applier } from "../../types.js"

const INSERT: Applier<"AttendanceRegister", "INSERT"> = async ({ dbClient, afterImage }) => {
    let coursesCount = await dbClient.course.count({
        where: {
            id: afterImage.courseId
        }
    })

    if (coursesCount <= 0) {
        throw new Error("Course not found")
    }

    if (!/^(\d{4})\/(\d{4})$/.test(afterImage.session)) {
        throw new Error("Invalid session format")
    }

    if (!Array.isArray(afterImage.decision)) {
        throw new Error("Invalid decision format")
    }

    let decisionTypeChecking = attendanceRegisterDecisionExpressionTypeChecker(afterImage.decision as any[])

    if (decisionTypeChecking.status == "failed") {
        throw new Error(decisionTypeChecking.error.message)
    }

    const attendanceRegistersCountByCourseIdSession = await dbClient.attendanceRegister.count({
        where: {
            session: afterImage.session,
            courseId: afterImage.courseId
        }
    })

    if (attendanceRegistersCountByCourseIdSession > 0) {
        throw new Error("Attendance register already exist")
    }

    await dbClient.attendanceRegister.create({
        data: {
            id: afterImage.id,
            decision: afterImage.decision,
            courseId: afterImage.courseId,
            session: afterImage.session,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        },
    })
}

const UPDATE: Applier<"AttendanceRegister", "UPDATE"> = async ({ dbClient, afterImage }) => {
    let coursesCount = await dbClient.course.count({
        where: {
            id: afterImage.courseId
        }
    })

    if (coursesCount <= 0) {
        throw new Error("Course not found")
    }

    if (!/^(\d{4})\/(\d{4})$/.test(afterImage.session)) {
        throw new Error("Invalid session format")
    }

    if (!Array.isArray(afterImage.decision)) {
        throw new Error("Invalid decision format")
    }

    let decisionTypeChecking = attendanceRegisterDecisionExpressionTypeChecker(afterImage.decision as any[])

    if (decisionTypeChecking.status == "failed") {
        throw new Error(decisionTypeChecking.error.message)
    }

    const attendanceRegistersCountByCourseIdSession = await dbClient.attendanceRegister.count({
        where: {
            session: afterImage.session,
            courseId: afterImage.courseId,
            id: {
                not: {
                    equals: afterImage.id
                }
            }
        }
    })

    if (attendanceRegistersCountByCourseIdSession > 0) {
        throw new Error("Attendance register already exist")
    }

    await dbClient.attendanceRegister.update({
        where: {
            id: afterImage.id
        },
        data: {
            decision: afterImage.decision,
            courseId: afterImage.courseId,
            session: afterImage.session,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        },
    })
}

const DELETE: Applier<"AttendanceRegister", "DELETE"> = async ({ dbClient, beforeImage }) => {
    const attendanceRegistersCount = await dbClient.attendanceRegister.count({
        where: {
            id: beforeImage.id
        }
    })

    if (attendanceRegistersCount <= 0) {
        throw new Error("Attendance register not found")
    }

    await dbClient.attendanceRegister.delete({
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