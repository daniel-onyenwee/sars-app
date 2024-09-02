import type { Applier } from "../../types.js"

const INSERT: Applier<"CourseClashAttendance", "INSERT"> = async ({ dbClient, afterImage }) => {
    const classAttendeesCount = await dbClient.classAttendee.count({
        where: {
            id: afterImage.id
        }
    })

    if (classAttendeesCount <= 0) {
        throw new Error("Class attendee not found")
    }

    const studentsCount = await dbClient.student.count({
        where: {
            id: afterImage.id
        }
    })

    if (studentsCount <= 0) {
        throw new Error("Student not found")
    }

    const coursesCount = await dbClient.course.count({
        where: {
            id: afterImage.id
        }
    })

    if (coursesCount <= 0) {
        throw new Error("Course not found")
    }

    await dbClient.courseClashAttendance.create({
        data: {
            id: afterImage.id,
            courseId: afterImage.courseId,
            studentId: afterImage.studentId,
            classAttendeeId: afterImage.classAttendeeId,
            session: afterImage.session,
            date: afterImage.date,
            startTime: afterImage.startTime,
            endTime: afterImage.endTime,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        }
    })
}

const UPDATE: Applier<"CourseClashAttendance", "UPDATE"> = async ({ dbClient, afterImage }) => {
    const classAttendeesCount = await dbClient.classAttendee.count({
        where: {
            id: afterImage.id
        }
    })

    if (classAttendeesCount <= 0) {
        throw new Error("Class attendee not found")
    }

    const studentsCount = await dbClient.student.count({
        where: {
            id: afterImage.id
        }
    })

    if (studentsCount <= 0) {
        throw new Error("Student not found")
    }

    const coursesCount = await dbClient.course.count({
        where: {
            id: afterImage.id
        }
    })

    if (coursesCount <= 0) {
        throw new Error("Course not found")
    }

    await dbClient.courseClashAttendance.update({
        where: {
            id: afterImage.id,
        },
        data: {
            courseId: afterImage.courseId,
            studentId: afterImage.studentId,
            classAttendeeId: afterImage.classAttendeeId,
            session: afterImage.session,
            date: afterImage.date,
            startTime: afterImage.startTime,
            endTime: afterImage.endTime,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        }
    })
}

const DELETE: Applier<"CourseClashAttendance", "DELETE"> = async ({ dbClient, beforeImage }) => {
    const courseClashAttendancesCount = await dbClient.courseClashAttendance.count({
        where: {
            id: beforeImage.id
        }
    })

    if (courseClashAttendancesCount <= 0) {
        throw new Error("Course clash attendance not found")
    }

    await dbClient.courseClashAttendance.delete({
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