import {
    attendanceRegisterDecisionExpressionTypeChecker,
    json
} from "@/utils"
import { prismaClient } from "@/server"
import type { RequestHandler } from "./$types"

interface RegisterIDRequestBody {
    courseId: string
    session: string
    decision: any[]
}

export const GET: RequestHandler = async ({ params }) => {
    let registerId = params.registerId

    let attendanceRegister = await prismaClient.attendanceRegister.findUnique({
        where: {
            id: registerId
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
                    endTime: true
                }
            },
            createdAt: true,
            updatedAt: true,
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
        course: {
            title,
            code,
            department: {
                name: departmentName,
                faculty: {
                    name: facultyName
                }
            },
            ...otherCourseData
        },
        ...otherData
    } = attendanceRegister

    return json.success({
        ok: true,
        data: {
            courseTitle: title,
            courseCode: code,
            ...otherCourseData,
            ...otherData,
            department: departmentName,
            faculty: facultyName
        },
        error: null
    })
}

export const PATCH: RequestHandler = async ({ params, request }) => {
    let registerId = params.registerId

    let attendanceRegistersCount = await prismaClient.attendanceRegister.findUnique({
        where: {
            id: registerId
        },
        select: {
            courseId: true,
            session: true,
        }
    })

    if (!attendanceRegistersCount) {
        return json.fail({
            ok: false,
            error: {
                message: "Attendance register not found",
                code: 4015
            },
            data: null
        })
    }

    let body: Partial<RegisterIDRequestBody> = {}

    try {
        body = await request.json()
    } catch (error) {
        body = {}
    }

    let updateData: Partial<RegisterIDRequestBody> = {}

    if (body.courseId) {
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

        updateData.courseId = body.courseId
    }

    if (body.session) {
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

        updateData.session = body.session
    }

    if (body.decision) {
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

        updateData.decision = body.decision
    }

    if (updateData.courseId || updateData.session) {
        const attendanceRegistersCountByCourseIdSession = await prismaClient.attendanceRegister.count({
            where: {
                session: updateData.session || attendanceRegistersCount.session,
                courseId: updateData.courseId || attendanceRegistersCount.courseId,
                id: {
                    not: {
                        equals: registerId
                    }
                }
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
    }

    const attendanceRegister = await prismaClient.attendanceRegister.update({
        where: {
            id: registerId
        },
        data: {
            decision: updateData.decision,
            courseId: updateData.courseId,
            session: updateData.session,
        },
        select: {
            id: true,
            decision: true,
            session: true,
            classAttendances: {
                orderBy: {
                    date: "asc"
                },
                select: {
                    id: true,
                    date: true,
                    startTime: true,
                    endTime: true
                }
            },
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

export const DELETE: RequestHandler = async ({ params }) => {
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

    const attendanceRegister = await prismaClient.attendanceRegister.delete({
        where: {
            id: registerId
        },
        select: {
            id: true,
            decision: true,
            session: true,
            classAttendances: {
                orderBy: {
                    date: "asc"
                },
                select: {
                    id: true,
                    date: true,
                    startTime: true,
                    endTime: true
                }
            },
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
            title,
            code,
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