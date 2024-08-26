import type { PrismaClient } from "@prisma/client"
import { differenceInTimePeriods } from "../difference-in-time-periods"
import { attendanceRegisterStudentDecisionDeterminer } from "../attendance-register"

type ArrangeOrder = "asc" | "desc"

interface surnameQueryOrderByObject {
    student: {
        surname?: ArrangeOrder
    }
}

interface otherNamesQueryOrderByObject {
    student: {
        otherNames?: ArrangeOrder
    }
}

type QueryOrderByObject = {
    student: {
        regno?: ArrangeOrder
    }
} | (surnameQueryOrderByObject | otherNamesQueryOrderByObject)[]

export default async function ({ prismaClient, courseId, session, name = undefined, regno = undefined, orderBy = { student: {} }, page = 1, count = 100, getAllRecord = false }:
    { prismaClient: PrismaClient; courseId: string; session: string; name?: string | undefined; regno?: string | undefined; orderBy?: QueryOrderByObject; page?: number; count?: number; getAllRecord?: boolean }) {
    let attendanceRegisterQuery = await prismaClient.attendanceRegister.findUnique({
        where: {
            courseId_session: {
                courseId,
                session
            }
        },
        select: {
            decision: true,
            classAttendances: {
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
                    date: true,
                    startTime: true,
                    endTime: true,
                    classAttendees: {
                        select: {
                            attendanceRegisterStudentId: true
                        }
                    }
                }
            },
            attendanceRegisterStudents: {
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
                                otherNames: name ? {
                                    in: name.split(/\s+/),
                                    mode: "insensitive"
                                } : undefined
                            },
                            {
                                surname: name ? {
                                    in: name.split(/\s+/),
                                    mode: "insensitive"
                                } : undefined
                            }
                        ],
                    }
                },
                orderBy,
                skip: !getAllRecord ? page * count : undefined,
                take: !getAllRecord ? count : undefined,
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
            }
        }
    })

    if (!attendanceRegisterQuery) {
        return {
            totalClasses: 0,
            totalClassesInHour: 0,
            classesDate: [] as { id: string, date: Date, startTime: Date, endTime: Date }[],
            attendances: [] as any
        }
    }

    const {
        attendanceRegisterStudents,
        decision,
        classAttendances
    } = attendanceRegisterQuery

    const numberOfClassTaught = classAttendances.length

    const classesDate = classAttendances.map(({ classAttendees: _, ...otherClassAttendanceData }) => ({ ...otherClassAttendanceData }))

    const totalClassesInHour = differenceInTimePeriods("hour", classAttendances.map(({ startTime, endTime }) => ({ startTime, endTime })))

    const students = attendanceRegisterStudents
        .map(({ id, student: { otherNames, surname, department: { name: departmentName, faculty: { name: facultyName } }, ...otherStudentData } }) => {
            let attendances: Record<string, 1 | 0> = {}
            let studentNumberOfClassAttended = 0
            let studentPercentageOfClassAttended = 0

            classAttendances.forEach(({ id: classAttendanceId, classAttendees }) => {
                let isPresent = classAttendees.map(({ attendanceRegisterStudentId }) => attendanceRegisterStudentId).includes(id)
                if (isPresent) {
                    studentNumberOfClassAttended += 1
                }
                attendances[classAttendanceId] = isPresent ? 1 : 0
            })

            studentPercentageOfClassAttended = ((studentNumberOfClassAttended / (numberOfClassTaught || 1)) * 100)

            return ({
                id,
                name: `${surname} ${otherNames}`.toString(),
                surname,
                otherNames,
                regno: otherStudentData.regno,
                ...attendances,
                classesAttended: studentNumberOfClassAttended,
                classesAttendedPercentage: studentPercentageOfClassAttended,
                numberOfClassTaught,
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
                    structuredClone(decision) as any,
                    "AND"
                )
            })
        })

    return {
        totalClasses: numberOfClassTaught,
        classesDate,
        totalClassesInHour,
        attendances: students
    }
}