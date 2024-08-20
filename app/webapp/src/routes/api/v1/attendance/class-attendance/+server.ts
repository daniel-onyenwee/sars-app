import { getCurrentSession, json, mergeCourseClashQuery, prismaClient } from "@/utils"
import type { RequestHandler } from "./$types"
import { Prisma, type $Enums } from "@prisma/client"
import { differenceInHours, subMonths } from "date-fns"

interface ClassAttendanceRequestBody {
    attendanceRegisterId: string
    attendanceRegisterLecturerId: string
    date: string
    startTime: string
    endTime: string
}

type CourseArrangeBy = "courseTitle" | "courseCode" | "session" | "semester" | "department" | "faculty" | "level"

type ArrangeBy = "date" | "startTime" | "endTime" | "updatedAt" | "createdAt" | "lecturerName" | CourseArrangeBy

type ArrangeOrder = "asc" | "desc"

interface LecturerSurnameQueryOrderByObject {
    attendanceRegisterLecturer: {
        lecturer: {
            surname?: ArrangeOrder
        }
    }
}

interface LecturerOtherNamesQueryOrderByObject {
    attendanceRegisterLecturer: {
        lecturer: {
            otherNames?: ArrangeOrder
        }
    }
}

type QueryOrderByObject = (Partial<Omit<Record<ArrangeBy, ArrangeOrder>, "lecturerName" | "createdAt" | "updatedAt" | CourseArrangeBy>> & {
    createdAt?: ArrangeOrder
    updatedAt?: ArrangeOrder
    attendanceRegister?: {
        session?: ArrangeOrder
        course?: {
            title?: ArrangeOrder
            code?: ArrangeOrder
            semester?: ArrangeOrder
            level?: ArrangeOrder
            department?: {
                name?: ArrangeOrder
                faculty?: {
                    name?: ArrangeOrder
                }
            }
        }
    }
}) | (LecturerSurnameQueryOrderByObject | LecturerOtherNamesQueryOrderByObject)[]

export const GET: RequestHandler = async ({ url }) => {
    let date = url.searchParams.get("date") || String()
    let startTime = url.searchParams.get("startTime") || String()
    let endTime = url.searchParams.get("endTime") || String()
    let department = url.searchParams.get("department") || String()
    let lecturerName = url.searchParams.get("lecturerName") || String()
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

    // Number.isNaN(new Date(date).getDate()) to check if 'date' is a valid date input
    if (date && Number.isNaN(new Date(date).getDate())) {
        date = new Date().toISOString()
    }

    let searchBy: ArrangeBy = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["date", "startTime", "endTime", "updatedAt", "createdAt", "lecturerName", "courseTitle", "courseCode", "session", "semester", "department", "faculty", "level"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {}

    if (searchBy == "lecturerName") {
        orderBy = [
            {
                attendanceRegisterLecturer: {
                    lecturer: {
                        surname: searchOrder
                    }
                }
            },
            {
                attendanceRegisterLecturer: {
                    lecturer: {
                        otherNames: searchOrder
                    }
                }
            }
        ]
    } else if (searchBy == "session") {
        orderBy = {
            attendanceRegister: {
                session: searchOrder
            }
        }
    } else if (searchBy == "courseCode") {
        orderBy = {
            attendanceRegister: {
                course: {
                    code: searchOrder
                }
            }
        }
    } else if (searchBy == "department") {
        orderBy = {
            attendanceRegister: {
                course: {
                    department: {
                        name: searchOrder
                    }
                }
            }
        }
    } else if (searchBy == "faculty") {
        orderBy = {
            attendanceRegister: {
                course: {
                    department: {
                        faculty: {
                            name: searchOrder
                        }
                    }
                }
            }
        }
    } else if (searchBy == "semester" || searchBy == "level") {
        orderBy = {
            attendanceRegister: {
                course: {
                    [searchBy]: searchOrder
                }
            }
        }
    } else if (searchBy == "courseTitle") {
        orderBy = {
            attendanceRegister: {
                course: {
                    title: searchOrder
                }
            }
        }
    } else if (searchBy == "createdAt" || searchBy == "updatedAt") {
        delete Object(orderBy).attendanceRegister
        orderBy[searchBy] = searchOrder
    } else {
        orderBy[searchBy] = searchOrder
    }

    const ClassAttendancesQuery = await prismaClient.classAttendance.findMany({
        where: {
            date: date ? {
                equals: date
            } : undefined,
            startTime: startTime ? {
                equals: startTime
            } : undefined,
            endTime: endTime ? {
                equals: endTime
            } : undefined,
            attendanceRegister: {
                session: {
                    contains: session,
                    mode: "insensitive"
                },
                course: {
                    code: {
                        contains: courseCode,
                        mode: "insensitive"
                    },
                    title: {
                        contains: courseTitle,
                        mode: "insensitive"
                    },
                    semester: semester ? {
                        equals: semester as $Enums.Semester
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
                }
            },
            attendanceRegisterLecturer: {
                lecturer: {
                    OR: [
                        {
                            surname: {
                                contains: lecturerName,
                                mode: "insensitive"
                            }
                        },
                        {
                            otherNames: {
                                contains: lecturerName,
                                mode: "insensitive"
                            }
                        },
                        {
                            otherNames: {
                                in: lecturerName.split(/\s+/),
                                mode: "insensitive"
                            }
                        },
                        {
                            surname: {
                                in: lecturerName.split(/\s+/),
                                mode: "insensitive"
                            }
                        }
                    ]
                }
            }
        },
        orderBy,
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        select: {
            id: true,
            endTime: true,
            date: true,
            startTime: true,
            createdAt: true,
            updatedAt: true,
            attendanceRegister: {
                select: {
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
                    }
                }
            },
            attendanceRegisterLecturer: {
                select: {
                    lecturer: {
                        select: {
                            otherNames: true,
                            surname: true,
                            username: true,
                        }
                    }
                }
            }
        }
    })

    let classAttendances = ClassAttendancesQuery.map(({ attendanceRegister: { course, ...otherAttendanceRegisterData }, attendanceRegisterLecturer, date, startTime, endTime, ...otherData }) => {
        let {
            surname,
            otherNames,
            username
        } = attendanceRegisterLecturer.lecturer
        let {
            code: courseCode,
            title: courseTitle,
            department: {
                name: departmentName,
                faculty: {
                    name: facultyName
                }
            },
            ...otherCourseDate
        } = course
        return ({
            courseTitle,
            courseCode,
            ...otherCourseDate,
            ...otherAttendanceRegisterData,
            lecturerName: `${surname} ${otherNames}`.toUpperCase(),
            lecturerUsername: username,
            department: departmentName,
            faculty: facultyName,
            date,
            startTime,
            endTime,
            ...otherData
        })
    })


    return json.success({
        ok: true,
        data: classAttendances,
        error: null
    })
}

export const POST: RequestHandler = async ({ request }) => {
    let body: ClassAttendanceRequestBody | null = null

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

    if (!body.attendanceRegisterId) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'attendanceRegisterId'",
                code: 4016
            },
            data: null
        })
    }

    if (!body.attendanceRegisterLecturerId) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'attendanceRegisterLecturerId'",
                code: 4017
            },
            data: null
        })
    }

    if (!body.date) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'date'",
                code: 4018
            },
            data: null
        })
    }

    if (!body.startTime) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'startTime'",
                code: 4019
            },
            data: null
        })
    }

    if (!body.endTime) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'endTime'",
                code: 4020
            },
            data: null
        })
    }

    // Number.isNaN(new Date(body.date).getDate()) to check if body.date is a valid date input
    if (Number.isNaN(new Date(body.date).getDate())) {
        return json.fail({
            ok: false,
            error: {
                message: "Invalid date format",
                code: 4021
            },
            data: null
        })
    }

    // Number.isNaN(new Date(body.startTime).getDate()) to check if body.startTime is a valid date input
    if (Number.isNaN(new Date(body.startTime).getDate())) {
        return json.fail({
            ok: false,
            error: {
                message: "Invalid startTime format",
                code: 4022
            },
            data: null
        })
    }

    // Number.isNaN(new Date(body.endTime).getDate()) to check if body.endTime is a valid date input
    if (Number.isNaN(new Date(body.endTime).getDate())) {
        return json.fail({
            ok: false,
            error: {
                message: "Invalid endTime format",
                code: 4023
            },
            data: null
        })
    }

    if (differenceInHours(body.endTime, body.startTime) > 2) {
        return json.fail({
            ok: false,
            error: {
                message: "Class exceeded two hour mark",
                code: 4033
            },
            data: null
        })
    }

    // Check if the attendance register exist
    let attendanceRegister = await prismaClient.attendanceRegister.findUnique({
        where: {
            id: body.attendanceRegisterId,
        },
        select: {
            session: true,
            courseId: true
        }
    })

    if (!attendanceRegister) {
        return json.fail({
            ok: false,
            error: {
                message: "Attendance register not found",
                code: 4015
            },
            data: null
        })
    }

    // Check if the attendance register lecturer exist
    let attendanceRegisterLecturersCount = await prismaClient.attendanceRegisterLecturer.count({
        where: {
            id: body.attendanceRegisterLecturerId,
            attendanceRegisterId: body.attendanceRegisterId
        }
    })

    if (attendanceRegisterLecturersCount <= 0) {
        return json.fail({
            ok: false,
            error: {
                message: "Attendance register lecturer not found",
                code: 4024
            },
            data: null
        })
    }

    // Check if a class attendance with same property already exist
    const classAttendanceCountByAttendanceRegisterIdAttendanceRegisterLecturerIdDate = await prismaClient.classAttendance.count({
        where: {
            date: body.date,
            attendanceRegisterId: body.attendanceRegisterId,
            startTime: {
                gte: body.startTime
            },
            endTime: {
                lt: body.endTime
            }
        }
    })

    if (classAttendanceCountByAttendanceRegisterIdAttendanceRegisterLecturerIdDate > 0) {
        return json.fail({
            ok: false,
            error: {
                message: "Class attendance already exist",
                code: 4025
            },
            data: null
        })
    }

    // Delete all the crash course data that are 1 month ago
    await prismaClient.courseClashAttendance.deleteMany({
        where: {
            courseId: attendanceRegister.courseId,
            date: {
                lte: subMonths(body.date, 1)
            }
        }
    })

    // Create the class attendance
    const classAttendance = await prismaClient.classAttendance.create({
        data: {
            attendanceRegisterId: body.attendanceRegisterId,
            attendanceRegisterLecturerId: body.attendanceRegisterLecturerId,
            date: body.date,
            startTime: body.startTime,
            endTime: body.endTime
        },
        select: {
            id: true,
            endTime: true,
            date: true,
            startTime: true,
            createdAt: true,
            updatedAt: true,
            attendanceRegister: {
                select: {
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
                    }
                }
            },
            attendanceRegisterLecturer: {
                select: {
                    lecturer: {
                        select: {
                            otherNames: true,
                            surname: true,
                            username: true
                        }
                    }
                }
            }
        }
    })

    let {
        attendanceRegister: {
            course,
            ...otherAttendanceRegisterData
        },
        attendanceRegisterLecturer,
        date,
        startTime,
        endTime,
        ...otherData
    } = classAttendance

    // Raw sql to handle merging of course crashes to their respective class attendances 
    await prismaClient.$executeRaw(Prisma.sql([mergeCourseClashQuery]))

    let {
        surname,
        username,
        otherNames,
    } = attendanceRegisterLecturer.lecturer
    let {
        code: courseCode,
        title: courseTitle,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        },
        ...otherCourseDate
    } = course

    return json.success({
        ok: true,
        data: {
            courseTitle,
            courseCode,
            ...otherCourseDate,
            ...otherAttendanceRegisterData,
            lecturerName: `${surname} ${otherNames}`.toUpperCase(),
            lecturerUsername: username,
            department: departmentName,
            faculty: facultyName,
            date,
            startTime,
            endTime,
            ...otherData
        },
        error: null
    })
}

export const DELETE: RequestHandler = async ({ request }) => {
    let body: { classAttendancesId: string[] }

    try {
        body = await request.json()
    } catch (error) {
        body = { classAttendancesId: [] }
    }

    if (body) {
        body.classAttendancesId = body.classAttendancesId || []
    }

    await prismaClient.classAttendance.deleteMany({
        where: {
            id: {
                in: body.classAttendancesId
            }
        }
    })

    return json.success({
        ok: true,
        data: null,
        error: null
    })
}