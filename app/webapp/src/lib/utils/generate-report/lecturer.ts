import type { $Enums, PrismaClient } from "@prisma/client"
import { differenceInTimePeriods } from "../difference-in-time-periods"

type ArrangeOrder = "asc" | "desc"

type QueryOrderByObject = {
    course: Partial<Record<"code" | "title" | "semester", ArrangeOrder>>
}

export default async function (
    { prismaClient, lecturerId, session, courseCode = undefined, courseTitle = undefined, semester = undefined, orderBy = { course: {} }, page = 1, count = 100, getAllRecord = false }:
        { prismaClient: PrismaClient; lecturerId: string; session: string; courseCode?: string | undefined; courseTitle?: string | undefined; semester?: string | undefined; orderBy?: QueryOrderByObject; page?: number; count?: number; getAllRecord?: boolean }) {
    let attendanceRegistersQuery = await prismaClient.attendanceRegister.findMany({
        where: {
            session: session,
            attendanceRegisterLecturers: {
                some: {
                    lecturerId: lecturerId
                }
            },
            course: {
                semester: semester ? {
                    equals: semester as $Enums.Semester
                } : undefined,
                title: {
                    contains: courseTitle,
                    mode: "insensitive"
                },
                code: {
                    contains: courseCode,
                    mode: "insensitive"
                }
            }
        },
        orderBy,
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        select: {
            id: true,
            course: {
                select: {
                    code: true,
                    title: true,
                    semester: true
                }
            },
            classAttendances: {
                select: {
                    _count: true,
                    startTime: true,
                    endTime: true,
                    attendanceRegisterLecturer: {
                        select: {
                            lecturerId: true
                        }
                    }
                }
            }
        }
    })

    let courses = attendanceRegistersQuery.map(({ id, course, classAttendances }) => {
        let lecturerClassAttendances = classAttendances
            .filter(({ attendanceRegisterLecturer }) => attendanceRegisterLecturer.lecturerId == lecturerId)
        return ({
            id,
            courseCode: course.code,
            courseTitle: course.title,
            totalClasses: classAttendances.length,
            semester: course.semester,
            totalClassesInHour: differenceInTimePeriods("hour", classAttendances.map(({ startTime, endTime }) => ({ startTime, endTime }))),
            classesTaught: lecturerClassAttendances.length,
            classesTaughtInHour: differenceInTimePeriods("hour", lecturerClassAttendances.map(({ startTime, endTime }) => ({ startTime, endTime }))),
            classesTaughtPercentage: (lecturerClassAttendances.length / classAttendances.length) * 100
        })
    })

    return courses
}