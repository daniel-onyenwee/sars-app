import { json } from "@/utils"
import type { RequestHandler } from "./$types"
import { prismaClient } from "@/server"

interface ClassAttendeeSurnameQueryOrderByObject {
    attendanceRegisterStudent: {
        student: {
            surname: ArrangeOrder
        }
    }
}

interface ClassAttendeeOtherNamesQueryOrderByObject {
    attendanceRegisterStudent: {
        student: {
            otherNames: ArrangeOrder
        }
    }
}

type QueryOrderByObject = {
    attendanceRegisterStudent?: {
        student: {
            regno: ArrangeOrder
        }
    }
    courseClashAttendance?: {
        course: {
            code: ArrangeOrder
        }
    }
} | (ClassAttendeeSurnameQueryOrderByObject | ClassAttendeeOtherNamesQueryOrderByObject)[]

type ArrangeBy = "name" | "regno" | "courseClash"

type ArrangeOrder = "asc" | "desc"

interface ClassAttendeeRouteRequestBody {
    classAttendees: {
        studentId: string
        courseClashId?: string
    }[]
}

export const GET: RequestHandler = async ({ params, url }) => {
    let classAttendanceId = params.classAttendanceId

    let classAttendancesCount = await prismaClient.classAttendance.count({
        where: {
            id: classAttendanceId
        }
    })

    if (classAttendancesCount <= 0) {
        return json.fail({
            ok: false,
            error: {
                message: "Class attendance not found",
                code: 4026
            },
            data: null
        })
    }

    let name = url.searchParams.get("name") || String()
    let regno = url.searchParams.get("regno") || String()
    let courseClash = url.searchParams.get("courseClash") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    let searchBy: ArrangeBy = "name"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "regno", "courseClash"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "name"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {}

    if (searchBy == "name") {
        orderBy = [
            {
                attendanceRegisterStudent: {
                    student: {
                        surname: searchOrder
                    }
                }
            },
            {
                attendanceRegisterStudent: {
                    student: {
                        otherNames: searchOrder
                    }
                }
            }
        ]
    } else if (searchBy == "regno") {
        orderBy = {
            attendanceRegisterStudent: {
                student: {
                    regno: searchOrder
                }
            }
        }
    } else {
        orderBy = {
            courseClashAttendance: {
                course: {
                    code: "asc"
                }
            }
        }
    }

    const classAttendeesQuery = await prismaClient.classAttendee.findMany({
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        orderBy,
        where: {
            classAttendanceId: classAttendanceId,
            courseClashAttendance: courseClash ? {
                course: {
                    code: {
                        contains: courseClash,
                        mode: "insensitive"
                    }
                }
            } : undefined,
            attendanceRegisterStudent: {
                student: {
                    regno: {
                        contains: regno,
                        mode: "insensitive"
                    },
                    OR: [
                        {
                            surname: {
                                contains: name,
                                mode: "insensitive"
                            }
                        },
                        {
                            otherNames: {
                                contains: name,
                                mode: "insensitive"
                            }
                        },
                        {
                            otherNames: {
                                in: name.split(/\s+/),
                                mode: "insensitive"
                            }
                        },
                        {
                            surname: {
                                in: name.split(/\s+/),
                                mode: "insensitive"
                            }
                        }
                    ]
                }
            }
        },
        select: {
            id: true,
            courseClashAttendance: {
                select: {
                    course: {
                        select: {
                            code: true,
                            title: true
                        }
                    }
                }
            },
            attendanceRegisterStudent: {
                select: {
                    student: {
                        select: {
                            regno: true,
                            otherNames: true,
                            surname: true
                        }
                    }
                }
            }
        }
    })

    let classAttendees = classAttendeesQuery.map(({ id, courseClashAttendance, attendanceRegisterStudent }) => {
        let {
            regno,
            surname,
            otherNames
        } = attendanceRegisterStudent.student
        return ({
            id,
            regno,
            status: "PRESENT",
            surname,
            otherNames,
            name: `${surname} ${otherNames}`.toUpperCase(),
            courseClashTitle: courseClashAttendance ? courseClashAttendance.course.title : null,
            courseClashCode: courseClashAttendance ? courseClashAttendance.course.code : null
        })
    })

    return json.success({
        ok: true,
        data: classAttendees,
        error: null
    })
}

export const POST: RequestHandler = async ({ params, request }) => {
    let classAttendanceId = params.classAttendanceId

    let classAttendancesCount = await prismaClient.classAttendance.findUnique({
        where: {
            id: classAttendanceId
        },
        select: {
            attendanceRegisterId: true,
            attendanceRegister: {
                select: {
                    courseId: true,
                    session: true
                }
            },
            date: true,
            startTime: true,
            endTime: true,
        }
    })

    if (!classAttendancesCount) {
        return json.fail({
            ok: false,
            error: {
                message: "Class attendance not found",
                code: 4026
            },
            data: null
        })
    }

    let body: ClassAttendeeRouteRequestBody | null = null

    try {
        body = await request.json()
    } catch (error) {
        body = null
    }

    if (!body) {
        return json.fail({
            ok: false,
            error: {
                message: "Request body missing",
                code: 1004
            },
            data: null
        })
    }

    body.classAttendees = body.classAttendees || []

    const verifiedCourseIdsQuery = await prismaClient.course.findMany({
        where: {
            id: {
                in: body.classAttendees
                    .filter(({ courseClashId }) => typeof courseClashId == "string" && courseClashId != classAttendancesCount.attendanceRegister.courseId)
                    .map(({ courseClashId }) => (courseClashId || String()).toString())
            }
        },
        select: {
            id: true
        }
    })

    const verifiedCourseIds = verifiedCourseIdsQuery.map(({ id }) => id)

    let classAttendeesWithStudentIdAndCourseClashMap: Record<string, string> = {}

    const classAttendeeIds = body.classAttendees.map(({ studentId, courseClashId }) => {
        if (courseClashId && verifiedCourseIds.includes(courseClashId)) {
            classAttendeesWithStudentIdAndCourseClashMap[studentId] = courseClashId
        }

        return studentId
    })

    // Get all the class attendees that exist in attendance register student record
    let existingClassAttendees = await prismaClient.attendanceRegisterStudent.findMany({
        where: {
            attendanceRegisterId: classAttendancesCount.attendanceRegisterId,
            studentId: {
                in: classAttendeeIds
            }
        },
        select: {
            id: true,
            studentId: true
        }
    })

    // Get all the class attendees that don't exist in attendance register student record
    let attendanceUnregisterStudentIds = classAttendeeIds
        .filter((classAttendeeId) => {
            return !existingClassAttendees
                .map(({ studentId }) => studentId)
                .includes(classAttendeeId)
        })
        .map((id) => ({
            studentId: id,
        }))

    // Add the class attendees that don't exist in attendance register student record
    const attendanceUnregisterStudentQuery = await prismaClient.attendanceRegister.update({
        where: {
            id: classAttendancesCount.attendanceRegisterId
        },
        select: {
            attendanceRegisterStudents: {
                where: {
                    studentId: {
                        in: attendanceUnregisterStudentIds.map(({ studentId }) => studentId)
                    }
                },
                select: {
                    studentId: true,
                    id: true
                }
            }
        },
        data: {
            attendanceRegisterStudents: {
                createMany: {
                    data: attendanceUnregisterStudentIds,
                    skipDuplicates: true
                }
            }
        }
    })

    let attendanceUnregisterStudent = attendanceUnregisterStudentQuery.attendanceRegisterStudents

    existingClassAttendees.push(...attendanceUnregisterStudent)

    // Create class attendees
    let { classAttendees, ...classAttendance } = await prismaClient.classAttendance.update({
        where: {
            id: classAttendanceId
        },
        data: {
            classAttendees: {
                createMany: {
                    skipDuplicates: true,
                    data: existingClassAttendees.map(({ id }) => {
                        return ({
                            attendanceRegisterStudentId: id,
                        })
                    })
                }
            }
        },
        select: {
            endTime: true,
            date: true,
            startTime: true,
            createdAt: true,
            updatedAt: true,
            classAttendees: {
                select: {
                    attendanceRegisterStudent: {
                        select: {
                            studentId: true
                        }
                    },
                    id: true
                }
            },
        }
    })

    let classAttendeesWithStudentIdAndIdMap: Record<string, string> = {}

    classAttendees.forEach(({ id, attendanceRegisterStudent }) => [
        classAttendeesWithStudentIdAndIdMap[attendanceRegisterStudent.studentId] = id
    ])

    let classAttendeesWithCourseClash = body.classAttendees
        .filter(({ courseClashId }) => typeof courseClashId == "string" && courseClashId != classAttendancesCount.attendanceRegister.courseId)
        .map(({ studentId }) => studentId)

    let classAttendeeWithCourseClashRecords = existingClassAttendees
        .filter(({ studentId }) => classAttendeesWithCourseClash.includes(studentId))
        .filter(({ studentId }) => typeof classAttendeesWithStudentIdAndIdMap[studentId] == "string")
        .map(({ studentId }) => {
            return ({
                studentId,
                courseId: classAttendeesWithStudentIdAndCourseClashMap[studentId],
                date: classAttendance.date,
                classAttendeeId: classAttendeesWithStudentIdAndIdMap[studentId],
                session: classAttendancesCount.attendanceRegister.session,
                startTime: classAttendance.startTime,
                endTime: classAttendance.endTime
            })
        })

    await prismaClient.courseClashAttendance.createMany({
        skipDuplicates: true,
        data: classAttendeeWithCourseClashRecords
    })

    return json.success({
        ok: true,
        data: null,
        error: null
    })
}

export const DELETE: RequestHandler = async ({ params, request }) => {
    let classAttendanceId = params.classAttendanceId

    let classAttendancesCount = await prismaClient.classAttendance.findUnique({
        where: {
            id: classAttendanceId
        }
    })

    if (!classAttendancesCount) {
        return json.fail({
            ok: false,
            error: {
                message: "Class attendance not found",
                code: 4026
            },
            data: null
        })
    }

    let body: { classAttendeesId: string[] }

    try {
        body = await request.json()
    } catch (error) {
        body = { classAttendeesId: [] }
    }

    if (body) {
        body.classAttendeesId = body.classAttendeesId || []
    }

    await prismaClient.classAttendee.deleteMany({
        where: {
            id: {
                in: body.classAttendeesId
            },
            classAttendanceId: classAttendanceId
        }
    })

    return json.success({
        ok: true,
        data: null,
        error: null
    })
}