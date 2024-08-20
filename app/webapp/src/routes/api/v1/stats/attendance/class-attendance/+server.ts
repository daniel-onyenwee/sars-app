import type { $Enums } from "@prisma/client"
import type { RequestHandler } from "./$types"
import { getCurrentSession, json, prismaClient } from "@/utils"

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

    const ClassAttendancesCount = await prismaClient.classAttendance.count({
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
        }
    })

    return json.success({
        ok: true,
        data: {
            count: ClassAttendancesCount
        },
        error: null
    })
}