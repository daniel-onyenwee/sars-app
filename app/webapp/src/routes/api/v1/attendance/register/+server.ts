import {
    attendanceRegisterDecisionExpressionTypeChecker,
    getCurrentSession,
    json
} from "@/utils"
import { prismaClient } from "@/server"
import type { RequestHandler } from "./$types"
import type { $Enums } from "@prisma/client"

type ArrangeBy = "courseTitle" | "courseCode" | "session" | "semester" | "updatedAt" | "createdAt" | "department" | "faculty" | "level"

type ArrangeOrder = "asc" | "desc"

type QueryOrderByObject = {
    createdAt?: ArrangeOrder
    updatedAt?: ArrangeOrder
    course: Partial<Omit<Record<ArrangeBy, ArrangeOrder>, "updatedAt" | "createdAt" | "department" | "faculty" | "courseTitle" | "courseCode">> & {
        title?: ArrangeOrder
        code?: ArrangeOrder
        department?: Partial<{
            name: ArrangeOrder
            faculty: {
                name: ArrangeOrder
            }
        }>
    }
    session?: ArrangeOrder
}

interface RegisterRequestBody {
    courseId: string
    session: string
    decision: any[]
}


export const GET: RequestHandler = async ({ url }) => {
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let courseCode = url.searchParams.get("courseCode") || String()
    let courseTitle = url.searchParams.get("courseTitle") || String()
    let level = url.searchParams.get("level") || String()
    let semester = url.searchParams.get("semester") || String()
    let session = url.searchParams.get("session") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    if (semester) {
        semester = ["FIRST", "SECOND"].includes(semester) ? semester : "FIRST"
    }

    if (level) {
        level = /L_(100|200|300|400|500|600|700|800|900|10000)/.test(level) ? level : "L_100"
    }

    if (session) {
        session = /^(\d{4})\/(\d{4})$/.test(session) ? session : getCurrentSession()
    }

    let searchBy: ArrangeBy = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["courseTitle", "courseCode", "session", "semester", "updatedAt", "createdAt", "department", "faculty", "level"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {
        course: {}
    }
    if (searchBy == "session" || searchBy == "createdAt" || searchBy == "updatedAt") {
        delete Object(orderBy).course
        orderBy[searchBy] = searchOrder
    } else if (searchBy == "department") {
        orderBy.course = {
            department: {
                name: searchOrder
            }
        }
    } else if (searchBy == "faculty") {
        orderBy.course = {
            department: {
                faculty: {
                    name: searchOrder
                }
            }
        }
    } else if (searchBy == "courseCode") {
        orderBy.course = {
            code: searchOrder
        }
    } else if (searchBy == "courseTitle") {
        orderBy.course = {
            title: searchOrder
        }
    } else {
        orderBy.course = {
            [searchBy]: searchOrder
        }
    }

    const attendanceRegistersQuery = await prismaClient.attendanceRegister.findMany({
        where: {
            course: {
                title: {
                    contains: courseTitle,
                    mode: "insensitive"
                },
                code: {
                    contains: courseCode,
                    mode: "insensitive"
                },
                semester: semester ? {
                    equals: semester as $Enums.Semester,
                } : undefined,
                level: level ? {
                    equals: level as $Enums.Level
                } : undefined,
                department: {
                    name: {
                        contains: department,
                        mode: "insensitive"
                    },
                    faculty: {
                        name: {
                            contains: faculty,
                            mode: "insensitive"
                        }
                    }
                }
            },
            session: {
                contains: session,
                mode: "insensitive"
            }
        },
        orderBy,
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        select: {
            id: true,
            decision: true,
            session: true,
            course: {
                select: {
                    title: true,
                    code: true,
                    semester: true,
                    level: true,
                    department: {
                        select: {
                            name: true,
                            faculty: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            },
            createdAt: true,
            updatedAt: true,
        }
    })

    let attendanceRegisters = attendanceRegistersQuery.map(({ course: { title, code, department: { name: departmentName, faculty: { name: facultyName } }, ...otherCourseData }, ...otherData }) => {
        return ({
            courseTitle: title,
            courseCode: code,
            department: departmentName,
            faculty: facultyName,
            ...otherCourseData,
            ...otherData
        })
    })

    return json.success({
        ok: true,
        data: attendanceRegisters,
        error: null
    })
}

export const POST: RequestHandler = async ({ request }) => {
    let body: RegisterRequestBody | null = null

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

    if (!body.courseId) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'courseId'",
                code: 4000
            },
            data: null
        })
    }

    if (!body.session) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'session'",
                code: 4001
            },
            data: null
        })
    }

    if (!body.decision) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'decision'",
                code: 4002
            },
            data: null
        })
    }


    let coursesCount = await prismaClient.course.count({
        where: {
            id: body.courseId
        }
    })

    if (coursesCount <= 0) {
        return json.fail({
            ok: false,
            error: {
                message: "Course not found",
                code: 3015
            },
            data: null
        })
    }

    if (!/^(\d{4})\/(\d{4})$/.test(body.session)) {
        return json.fail({
            ok: false,
            error: {
                message: "Invalid session format",
                code: 4005
            },
            data: null
        })
    }

    if (!Array.isArray(body.decision)) {
        return json.fail({
            ok: false,
            error: {
                message: "Invalid decision format",
                code: 4006
            },
            data: null
        })
    }

    let decisionTypeChecking = attendanceRegisterDecisionExpressionTypeChecker(body.decision)

    if (decisionTypeChecking.status == "failed") {
        return json.fail({
            ok: false,
            error: decisionTypeChecking.error,
            data: null
        })
    }

    const attendanceRegistersCountByCourseIdSession = await prismaClient.attendanceRegister.count({
        where: {
            session: body.session,
            courseId: body.courseId
        }
    })

    if (attendanceRegistersCountByCourseIdSession > 0) {
        return json.fail({
            ok: false,
            error: {
                code: 4014,
                message: "Attendance register already exist"
            },
            data: null
        })
    }

    const attendanceRegister = await prismaClient.attendanceRegister.create({
        data: {
            decision: body.decision,
            courseId: body.courseId,
            session: body.session
        },
        select: {
            id: true,
            decision: true,
            session: true,
            course: {
                select: {
                    title: true,
                    code: true,
                    semester: true,
                    level: true,
                    department: {
                        select: {
                            name: true,
                            faculty: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            },
            createdAt: true,
            updatedAt: true,
        }
    })

    const {
        course: {
            code,
            title,
            department: {
                name: departmentName,
                faculty: {
                    name: facultyName
                }
            }, ...otherCourseData
        },
        ...otherData
    } = attendanceRegister

    return json.success({
        ok: true,
        data: {
            courseTitle: title,
            courseCode: code,
            department: departmentName,
            faculty: facultyName,
            ...otherCourseData,
            ...otherData
        },
        error: null
    })
}

export const DELETE: RequestHandler = async ({ request }) => {
    let body: { registersId: string[] }

    try {
        body = await request.json()
    } catch (error) {
        body = { registersId: [] }
    }

    if (body) {
        body.registersId = body.registersId || []
    }

    await prismaClient.attendanceRegister.deleteMany({
        where: {
            id: {
                in: body.registersId
            }
        }
    })

    return json.success({
        ok: true,
        data: null,
        error: null
    })
}