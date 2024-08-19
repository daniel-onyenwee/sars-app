import type { $Enums, PrismaClient } from "@prisma/client"

type ArrangeOrder = "asc" | "desc"

type QueryOrderByObject = {
    course: Partial<Record<"code" | "title" | "semester", ArrangeOrder>>
}

export default async function (
    { prismaClient, studentId, session, courseCode = undefined, courseTitle = undefined, semester = undefined, orderBy = { course: {} }, page = 1, count = 100, getAllRecord = false }:
        { prismaClient: PrismaClient; studentId: string; session: string; courseCode?: string | undefined; courseTitle?: string | undefined; semester?: string | undefined; orderBy?: QueryOrderByObject; page?: number; count?: number; getAllRecord?: boolean }
) {
    let attendanceRegistersQuery = await prismaClient.attendanceRegister.findMany({
        where: {
            session: session,
            attendanceRegisterStudents: {
                some: {
                    studentId: studentId
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
            _count: {
                select: {
                    classAttendances: true
                }
            },
            classAttendances: {
                select: {
                    _count: true
                },
                where: {
                    classAttendees: {
                        some: {
                            attendanceRegisterStudent: {
                                studentId: studentId
                            }
                        }
                    }
                }
            }
        }
    })

    let courses = attendanceRegistersQuery.map(({ id, course, _count, classAttendances }) => {
        return ({
            id,
            courseCode: course.code,
            courseTitle: course.title,
            semester: course.semester,
            totalClasses: _count.classAttendances,
            classesAttended: classAttendances.length,
            classesAttendedPercentage: (classAttendances.length / _count.classAttendances) * 100
        })
    })

    return courses
}
