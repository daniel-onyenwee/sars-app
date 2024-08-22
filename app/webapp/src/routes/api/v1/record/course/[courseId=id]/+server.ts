import type { $Enums } from "@prisma/client"
import type { RequestHandler } from "./$types"
import { json, removeSpecialChar } from "@/utils"
import { prismaClient } from "@/server"

interface CourseIDRequestBody {
    title: string
    code: string
    level: $Enums.Level
    semester: $Enums.Semester
    departmentId: string
}

export const GET: RequestHandler = async ({ params }) => {
    let courseId = params.courseId

    let course = await prismaClient.course.findUnique({
        where: {
            id: courseId
        },
        select: {
            id: true,
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
            },
            createdAt: true,
            updatedAt: true
        }
    })

    if (!course) {
        return json.fail({
            ok: false,
            error: {
                message: "Course not found",
                code: 3015
            },
            data: null
        })
    }

    const { id, title, semester, code, level, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = course
    return json.success({
        ok: true,
        data: {
            id,
            code,
            title,
            level,
            semester,
            department: departmentName,
            faculty: facultyName,
            createdAt,
            updatedAt
        },
        error: null
    })
}

export const PATCH: RequestHandler = async ({ params, request }) => {
    let courseId = params.courseId

    let coursesCount = await prismaClient.course.findUnique({
        where: {
            id: courseId
        },
        select: {
            department: {
                select: {
                    levels: true
                }
            }
        }
    })

    if (!coursesCount) {
        return json.fail({
            ok: false,
            error: {
                message: "Course not found",
                code: 3015
            },
            data: null
        })
    }

    let body: Partial<CourseIDRequestBody> = {}

    try {
        body = await request.json()
    } catch (error) {
        body = {}
    }

    let updateData: Partial<CourseIDRequestBody> = {}

    if (body.departmentId) {
        const departmentsCount = await prismaClient.department.count({
            where: {
                id: body.departmentId
            }
        })

        if (departmentsCount <= 0) {
            return json.fail({
                ok: false,
                error: {
                    message: "Department not found",
                    code: 3006
                },
                data: null
            })
        }

        updateData.departmentId = body.departmentId
    }

    if (body.title) {
        updateData.title = body.title.toUpperCase()
    }

    if (body.code) {
        body.code = removeSpecialChar((body.code || String()).toUpperCase())
        if (!/^([abcdefghijklmnopqrstwuxyz]){1,}(\d+)$/i.test(body.code)) {
            return json.fail({
                ok: false,
                error: {
                    message: "Invalid course code format",
                    code: 3010
                },
                data: null
            })
        }

        const coursesCountByCode = await prismaClient.course.count({
            where: {
                code: body.code,
                id: {
                    not: {
                        equals: courseId
                    }
                }
            }
        })

        if (coursesCountByCode > 0) {
            return json.fail({
                ok: false,
                error: {
                    message: "Course already exist",
                    code: 3013
                },
                data: null
            })
        }

        updateData.code = body.code
    }

    if (body.level) {
        if (!/L_(100|200|300|400|500|600|700|800|900|1000)/.test(body.level)) {
            return json.fail({
                ok: false,
                error: {
                    message: "Invalid level format",
                    code: 3011
                },
                data: null
            })
        }

        if (!coursesCount.department.levels.includes(body.level as $Enums.Level)) {
            return json.fail({
                ok: false,
                error: {
                    message: "Level not supported",
                    code: 3014
                },
                data: null
            })
        }

        updateData.level = body.level
    }

    if (body.semester) {
        if (!/FIRST|SECOND/.test(body.semester)) {
            return json.fail({
                ok: false,
                error: {
                    message: "Invalid semester format",
                    code: 3012
                },
                data: null
            })
        }

        updateData.semester = body.semester
    }

    const course = await prismaClient.course.update({
        data: updateData,
        where: {
            id: courseId
        },
        select: {
            id: true,
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
            },
            createdAt: true,
            updatedAt: true
        }
    })

    const { id, title, semester, code, level, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = course
    return json.success({
        ok: true,
        data: {
            id,
            code,
            title,
            level,
            semester,
            department: departmentName,
            faculty: facultyName,
            createdAt,
            updatedAt
        },
        error: null
    })
}

export const DELETE: RequestHandler = async ({ params }) => {
    let courseId = params.courseId

    let coursesCount = await prismaClient.course.count({
        where: {
            id: courseId
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

    const course = await prismaClient.course.delete({
        where: {
            id: courseId
        },
        select: {
            id: true,
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
            },
            createdAt: true,
            updatedAt: true
        }
    })

    const { id, title, semester, code, level, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = course
    return json.success({
        ok: true,
        data: {
            id,
            code,
            title,
            level,
            semester,
            department: departmentName,
            faculty: facultyName,
            createdAt,
            updatedAt
        },
        error: null
    })
}