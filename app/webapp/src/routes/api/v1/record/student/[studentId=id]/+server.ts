import type { $Enums } from "@prisma/client"
import type { RequestHandler } from "./$types"
import { json, prismaClient } from "@/utils"

interface StudentIDRequestBody {
    surname: string
    otherNames: string
    gender: $Enums.Gender
    regno: string
    password: string
    departmentId: string
    level: $Enums.Level
}

export const GET: RequestHandler = async ({ params }) => {
    let studentId = params.studentId

    let student = await prismaClient.student.findUnique({
        where: {
            id: studentId
        },
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
            regno: true,
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

    if (!student) {
        return json.fail({
            ok: false,
            error: {
                message: "Student not found",
                code: 3023
            },
            data: null
        })
    }

    const {
        id,
        surname,
        otherNames,
        regno,
        level,
        gender,
        createdAt,
        updatedAt,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        }
    } = student


    return json.success({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            regno,
            surname,
            otherNames,
            gender,
            level,
            createdAt,
            updatedAt,
            department: departmentName,
            faculty: facultyName
        },
        error: null
    })
}

export const PATCH: RequestHandler = async ({ params, request }) => {
    let studentId = params.studentId

    let studentsCount = await prismaClient.student.findUnique({
        where: {
            id: studentId
        },
        select: {
            department: {
                select: {
                    levels: true
                }
            }
        }
    })

    if (!studentsCount) {
        return json.fail({
            ok: false,
            error: {
                message: "Student not found",
                code: 3023
            },
            data: null
        })
    }

    let body: Partial<StudentIDRequestBody> = {}

    try {
        body = await request.json()
    } catch (error) {
        body = {}
    }
    let updateData: Partial<StudentIDRequestBody> = {}

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

    if (body.regno) {
        const studentsCountByRegno = await prismaClient.student.count({
            where: {
                regno: body.regno,
                id: {
                    not: {
                        equals: studentId
                    }
                }
            }
        })

        if (studentsCountByRegno > 0) {
            return json.fail({
                ok: false,
                error: {
                    message: "Regno already exist",
                    code: 3022
                },
                data: null
            })
        }

        updateData.regno = body.regno
    }

    if (body.surname) {
        updateData.surname = body.surname.toUpperCase()
    }

    if (body.otherNames) {
        updateData.otherNames = body.otherNames.toUpperCase()
    }

    if (body.password) {
        updateData.password = body.password
    }

    if (body.gender) {
        if (!["MALE", "FEMALE"].includes(body.gender)) {
            return json.fail({
                ok: false,
                error: {
                    message: "Invalid gender format",
                    code: 3019
                },
                data: null
            })
        }

        updateData.gender = body.gender
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

        if (!studentsCount.department.levels.includes(body.level as $Enums.Level)) {
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

    const student = await prismaClient.student.update({
        data: updateData,
        where: {
            id: studentId
        },
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
            regno: true,
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

    const {
        id,
        surname,
        otherNames,
        regno,
        level,
        gender,
        createdAt,
        updatedAt,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        }
    } = student


    return json.success({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            regno,
            surname,
            otherNames,
            gender,
            level,
            createdAt,
            updatedAt,
            department: departmentName,
            faculty: facultyName
        },
        error: null
    })
}

export const DELETE: RequestHandler = async ({ params }) => {
    let studentId = params.studentId

    let studentsCount = await prismaClient.student.count({
        where: {
            id: studentId
        }
    })

    if (studentsCount <= 0) {
        return json.fail({
            ok: false,
            error: {
                message: "Student not found",
                code: 3023
            },
            data: null
        })
    }

    let studentData = await prismaClient.student.delete({
        where: {
            id: studentId
        },
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
            regno: true,
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

    const {
        id,
        surname,
        otherNames,
        regno,
        level,
        gender,
        createdAt,
        updatedAt,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        }
    } = studentData


    return json.success({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            surname,
            otherNames,
            regno,
            level,
            gender,
            department: departmentName,
            faculty: facultyName,
            createdAt,
            updatedAt
        },
        error: null
    })
}