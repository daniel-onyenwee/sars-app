import { json } from "@/utils"
import { mergeCourseClashQuery, prismaClient } from "@/server"
import type { RequestHandler } from "./$types"
import { differenceInHours } from "date-fns"
import { Prisma } from "@prisma/client"

interface ClassAttendanceIDRequestBody {
    attendanceRegisterId: string
    attendanceRegisterLecturerId: string
    date: string
    startTime: string
    endTime: string
}

export const GET: RequestHandler = async ({ params }) => {
    let classAttendanceId = params.classAttendanceId

    const classAttendance = await prismaClient.classAttendance.findUnique({
        where: {
            id: classAttendanceId,
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

    if (!classAttendance) {
        return json.fail({
            ok: false,
            error: {
                message: "Class attendance not found",
                code: 4026
            },
            data: null
        })
    }

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
    let {
        surname,
        otherNames,
        username,
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

export const PATCH: RequestHandler = async ({ params, request }) => {
    let classAttendanceId = params.classAttendanceId

    let classAttendancesCount = await prismaClient.classAttendance.findUnique({
        where: {
            id: classAttendanceId,
        },
        select: {
            date: true,
            startTime: true,
            endTime: true,
            attendanceRegisterId: true
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

    let body: Partial<ClassAttendanceIDRequestBody> = {}

    try {
        body = await request.json()
    } catch (error) {
        body = {}
    }

    let updateData: Partial<ClassAttendanceIDRequestBody> = {}


    if (body.attendanceRegisterId) {
        // Check if the attendance register exist
        let attendanceRegister = await prismaClient.attendanceRegister.count({
            where: {
                id: body.attendanceRegisterId,
            }
        })

        if (attendanceRegister <= 0) {
            return json.fail({
                ok: false,
                error: {
                    message: "Attendance register not found",
                    code: 4015
                },
                data: null
            })
        }


        updateData.attendanceRegisterId = body.attendanceRegisterId
    }

    if (body.attendanceRegisterLecturerId) {
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

        updateData.attendanceRegisterLecturerId = body.attendanceRegisterLecturerId
    }

    if (body.date) {
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
    }

    if (body.startTime) {
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
    }

    if (body.endTime) {
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
    }

    if (body.date || body.endTime || body.startTime) {
        if (differenceInHours(body.endTime || classAttendancesCount.endTime, body.startTime || classAttendancesCount.startTime) > 2) {
            return json.fail({
                ok: false,
                error: {
                    message: "Class exceeded two hour mark",
                    code: 4033
                },
                data: null
            })
        }

        // Check if a class attendance with same property already exist
        const classAttendanceCountByAttendanceRegisterIdAttendanceRegisterLecturerIdDate = await prismaClient.classAttendance.count({
            where: {
                id: {
                    not: classAttendanceId
                },
                date: body.date || classAttendancesCount.date,
                attendanceRegisterId: classAttendancesCount.attendanceRegisterId,
                OR: [
                    {
                        startTime: {
                            lte: body.startTime || classAttendancesCount.startTime
                        },
                        endTime: {
                            gt: body.endTime || classAttendancesCount.endTime
                        }
                    },
                    {
                        startTime: {
                            lte: body.startTime || classAttendancesCount.startTime
                        },
                        endTime: {
                            gt: body.startTime || classAttendancesCount.startTime
                        }
                    },
                    {
                        startTime: {
                            lte: body.endTime || classAttendancesCount.endTime
                        },
                        endTime: {
                            gt: body.endTime || classAttendancesCount.endTime
                        }
                    }
                ]
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

        body.date ? updateData.date = body.date : void 0
        body.startTime ? updateData.startTime = body.startTime : void 0
        body.endTime ? updateData.endTime = body.endTime : void 0
    }

    // Update the class attendance
    const classAttendance = await prismaClient.classAttendance.update({
        where: {
            id: classAttendanceId
        },
        data: {
            attendanceRegisterId: updateData.attendanceRegisterId,
            attendanceRegisterLecturerId: updateData.attendanceRegisterLecturerId,
            date: updateData.date,
            startTime: updateData.startTime,
            endTime: updateData.endTime,
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
    let {
        surname,
        otherNames,
        username,
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

    // Update the course clash attendances
    let courseClashAttendanceUpdateQuery = prismaClient.courseClashAttendance.updateMany({
        where: {
            classAttendee: {
                classAttendanceId: classAttendanceId
            }
        },
        data: {
            date: updateData.date,
            startTime: updateData.startTime,
            endTime: updateData.endTime,
        }
    })

    // Delete the class attendee depending on the course clash attendances
    let dependentClassAttendeeDeleteQuery = prismaClient.classAttendee.deleteMany({
        where: {
            classAttendanceId: classAttendanceId,
            courseClashAttendanceDependingOnId: {
                not: null
            }
        }
    })

    await prismaClient.$transaction([courseClashAttendanceUpdateQuery, dependentClassAttendeeDeleteQuery])

    // Raw sql to handle merging of course crashes to their respective class attendances 
    await prismaClient.$executeRaw(Prisma.sql([mergeCourseClashQuery]))

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

export const DELETE: RequestHandler = async ({ params }) => {
    let classAttendanceId = params.classAttendanceId

    let classAttendancesCount = await prismaClient.classAttendance.findUnique({
        where: {
            id: classAttendanceId,
        },
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

    const classAttendance = await prismaClient.classAttendance.delete({
        where: {
            id: classAttendanceId,
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
                            username: true,
                        }
                    }
                }
            }
        }
    })

    let { attendanceRegister: { course, ...otherAttendanceRegisterData }, attendanceRegisterLecturer, date, startTime, endTime, ...otherData } = classAttendance
    let {
        surname,
        otherNames,
        username,
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