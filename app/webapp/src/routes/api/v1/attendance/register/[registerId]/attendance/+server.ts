import { attendanceRegisterStudentDecisionDeterminer, json } from "@/utils"
import { prismaClient } from "@/server"
import type { RequestHandler } from "./$types"

interface RegisterIDAttendanceRequestBody {
    classAttendanceId: string
    attendanceRegisterStudentId: string
    status: "PRESENT" | "ABSENT"
}

type ArrangeBy = "name" | "regno"

type ArrangeOrder = "asc" | "desc"

interface AttendanceRegisterStudentSurnameQueryOrderByObject {
    student: {
        surname?: ArrangeOrder
    }
}

interface AttendanceRegisterStudentOtherNamesQueryOrderByObject {
    student: {
        otherNames?: ArrangeOrder
    }
}

type QueryOrderByObject = {
    student: {
        regno?: ArrangeOrder
    }
} | (AttendanceRegisterStudentSurnameQueryOrderByObject | AttendanceRegisterStudentOtherNamesQueryOrderByObject)[]

export const GET: RequestHandler = async ({ params, url }) => {
    let registerId = params.registerId

    let name = url.searchParams.get("name") || String()
    let regno = url.searchParams.get("regno") || String()

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
        searchBy = ["name", "regno"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "name"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {
        student: {}
    }

    if (searchBy == "regno") {
        orderBy.student = {
            regno: searchOrder
        }
    } else {
        orderBy = [
            {
                student: {
                    otherNames: searchOrder
                }
            },
            {
                student: {
                    surname: searchOrder
                }
            }
        ]
    }

    let attendanceRegister = await prismaClient.attendanceRegister.findUnique({
        where: {
            id: registerId
        },
        select: {
            decision: true,
            attendanceRegisterStudents: {
                skip: !getAllRecord ? page * count : undefined,
                take: !getAllRecord ? count : undefined,
                orderBy,
                select: {
                    id: true,
                    student: {
                        select: {
                            surname: true,
                            otherNames: true,
                            level: true,
                            gender: true,
                            regno: true,
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
                },
                where: {
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

    const {
        attendanceRegisterStudents
    } = attendanceRegister

    let classAttendances = await prismaClient.classAttendance.findMany({
        where: {
            attendanceRegisterId: registerId,
        },
        orderBy: [
            {
                date: "asc"
            },
            {
                startTime: "asc"
            }
        ],
        select: {
            id: true,
            classAttendees: {
                select: {
                    attendanceRegisterStudentId: true
                }
            }
        }
    })

    const numberOfClassTaught = classAttendances.length

    const attendances = attendanceRegisterStudents
        .map(({ id: attendanceRegisterStudentId, student: { otherNames, surname, department: { name: departmentName, faculty: { name: facultyName } }, ...otherStudentData } }) => {
            let attendances: Record<string, "PRESENT" | "ABSENT"> = {}
            let studentNumberOfClassAttended = 0
            let studentPercentageOfClassAttended = 0

            classAttendances.forEach(({ id: classAttendanceId, classAttendees }) => {
                let isPresent = classAttendees.map(({ attendanceRegisterStudentId }) => attendanceRegisterStudentId).includes(attendanceRegisterStudentId)
                if (isPresent) {
                    studentNumberOfClassAttended += 1
                }
                attendances[classAttendanceId] = isPresent ? "PRESENT" : "ABSENT"
            })

            if (studentNumberOfClassAttended > 0) {
                studentPercentageOfClassAttended = ((studentNumberOfClassAttended / (numberOfClassTaught || 1)) * 100)
            }


            return ({
                id: attendanceRegisterStudentId,
                regno: otherStudentData.regno,
                name: `${surname} ${otherNames}`.toString(),
                surname,
                otherNames,
                numberOfClassTaught,
                ...attendances,
                classesAttended: studentNumberOfClassAttended,
                classesAttendedPercentage: studentPercentageOfClassAttended,
                decision: attendanceRegisterStudentDecisionDeterminer(
                    {
                        StudentName: `${surname} ${otherNames}`.toString(),
                        StudentDepartment: departmentName,
                        StudentFaculty: facultyName,
                        StudentRegno: otherStudentData.regno,
                        StudentGender: otherStudentData.gender,
                        StudentLevel: otherStudentData.level,
                        StudentNumberOfClassAttended: studentNumberOfClassAttended,
                        StudentPercentageOfClassAttended: studentPercentageOfClassAttended,
                        NumberOfClassTaught: numberOfClassTaught
                    },
                    structuredClone(attendanceRegister.decision) as any,
                    "AND"
                )
            })
        })

    return json.success({
        ok: true,
        data: attendances,
        error: null
    })
}

export const PATCH: RequestHandler = async ({ params, request }) => {
    let registerId = params.registerId

    let attendanceRegistersCount = await prismaClient.attendanceRegister.count({
        where: {
            id: registerId
        }
    })

    if (attendanceRegistersCount <= 0) {
        return json.fail({
            ok: false,
            error: {
                message: "Attendance register not found",
                code: 4015
            },
            data: null
        })
    }

    let body: RegisterIDAttendanceRequestBody | null = null

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

    if (!body.classAttendanceId) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'classAttendanceId'",
                code: 4034
            },
            data: null
        })
    }

    if (!body.attendanceRegisterStudentId) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'attendanceRegisterStudentId'",
                code: 4035
            },
            data: null
        })
    }

    if (!body.status) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'status'",
                code: 4029
            },
            data: null
        })
    }

    if (!["PRESENT", "ABSENT"].includes(body.status)) {
        return json.fail({
            ok: false,
            error: {
                message: "Invalid status format",
                code: 4030
            },
            data: null
        })
    }

    const [attendanceStudentsCount, classAttendancesCount] = await prismaClient.$transaction([
        prismaClient.attendanceRegisterStudent.count({
            where: {
                id: body.attendanceRegisterStudentId,
                attendanceRegisterId: registerId
            }
        }),
        prismaClient.classAttendance.findUnique({
            where: {
                id: body.classAttendanceId,
                attendanceRegisterId: registerId
            }
        })
    ])

    if (attendanceStudentsCount <= 0) {
        return json.fail({
            ok: false,
            error: {
                message: "Student not found",
                code: 3023
            },
            data: null
        })
    }

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

    if (body.status == "PRESENT") {
        const { attendanceRegisterStudent } = await prismaClient.classAttendee.upsert({
            where: {
                classAttendanceId_attendanceRegisterStudentId: {
                    attendanceRegisterStudentId: body.attendanceRegisterStudentId,
                    classAttendanceId: body.classAttendanceId
                }
            },
            update: {},
            create: {
                attendanceRegisterStudentId: body.attendanceRegisterStudentId,
                classAttendanceId: body.classAttendanceId,
            },
            select: {
                attendanceRegisterStudent: {
                    select: {
                        id: true,
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

        return json.success({
            ok: true,
            data: {
                id: attendanceRegisterStudent.id,
                surname: attendanceRegisterStudent.student.surname,
                otherNames: attendanceRegisterStudent.student.otherNames,
                regno: attendanceRegisterStudent.student.regno,
                name: `${attendanceRegisterStudent.student.surname} ${attendanceRegisterStudent.student.otherNames}`.toString(),
            },
            error: null
        })
    } else if (body.status == "ABSENT") {
        const { attendanceRegisterStudent } = await prismaClient.classAttendee.delete({
            where: {
                classAttendanceId_attendanceRegisterStudentId: {
                    attendanceRegisterStudentId: body.attendanceRegisterStudentId,
                    classAttendanceId: body.classAttendanceId
                }
            },
            select: {
                attendanceRegisterStudent: {
                    select: {
                        id: true,
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

        return json.success({
            ok: true,
            data: {
                id: attendanceRegisterStudent.id,
                surname: attendanceRegisterStudent.student.surname,
                otherNames: attendanceRegisterStudent.student.otherNames,
                regno: attendanceRegisterStudent.student.regno,
                name: `${attendanceRegisterStudent.student.surname} ${attendanceRegisterStudent.student.otherNames}`.toString(),
            },
            error: null
        })
    }

    return json.fail({
        ok: false,
        error: {
            message: "Invalid status format",
            code: 4030
        },
        data: null
    })
}