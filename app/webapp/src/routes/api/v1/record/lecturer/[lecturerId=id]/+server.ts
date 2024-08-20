import type { $Enums } from "@prisma/client";
import type { RequestHandler } from "./$types";
import { json, prismaClient } from "@/utils";

interface LecturerIDRequestBody {
    surname: string
    otherNames: string
    gender: $Enums.Gender
    username: string
    password: string
    departmentId: string
}

export const GET: RequestHandler = async ({ params }) => {
    let lecturerId = params.lecturerId

    let lecturer = await prismaClient.lecturer.findUnique({
        where: {
            id: lecturerId
        },
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
            username: true,
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

    if (!lecturer) {
        return json.fail({
            ok: false,
            error: {
                message: "Lecturer not found",
                code: 3020
            },
            data: null
        })
    }

    const { id, surname, otherNames, username, gender, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = lecturer

    return json.success({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            username,
            surname,
            otherNames,
            gender,
            createdAt,
            updatedAt,
            department: departmentName,
            faculty: facultyName
        },
        error: null
    })
}

export const PATCH: RequestHandler = async ({ params, request }) => {
    let lecturerId = params.lecturerId

    let lecturersCount = await prismaClient.lecturer.count({
        where: {
            id: lecturerId
        }
    })

    if (lecturersCount <= 0) {
        return json.fail({
            ok: false,
            error: {
                message: "Lecturer not found",
                code: 3020
            },
            data: null
        })
    }

    let body: Partial<LecturerIDRequestBody> = {}

    try {
        body = await request.json()
    } catch (error) {
        body = {}
    }
    let updateData: Partial<LecturerIDRequestBody> = {}

    if (body.username) {
        const lecturersCountByUsername = await prismaClient.lecturer.count({
            where: {
                username: body.username,
                id: {
                    not: {
                        equals: lecturerId
                    }
                }
            }
        })

        if (lecturersCountByUsername > 0) {
            return json.fail({
                ok: false,
                error: {
                    message: "Username already exist",
                    code: 2006
                },
                data: null
            })
        }

        updateData.username = body.username
    }

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

    let lecturer = await prismaClient.lecturer.update({
        where: {
            id: lecturerId
        },
        data: body,
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
            username: true,
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

    const { id, surname, otherNames, username, gender, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = lecturer

    return json.success({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            username,
            surname,
            otherNames,
            gender,
            createdAt,
            updatedAt,
            department: departmentName,
            faculty: facultyName
        },
        error: null
    })
}

export const DELETE: RequestHandler = async ({ params }) => {
    let lecturerId = params.lecturerId

    let lecturersCount = await prismaClient.lecturer.count({
        where: {
            id: lecturerId
        }
    })

    if (lecturersCount <= 0) {
        return json.fail({
            ok: false,
            error: {
                message: "Lecturer not found",
                code: 3020
            },
            data: null
        })
    }

    let lecturer = await prismaClient.lecturer.delete({
        where: {
            id: lecturerId
        },
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
            username: true,
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

    const { id, surname, otherNames, username, gender, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = lecturer

    return json.success({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            username,
            surname,
            otherNames,
            gender,
            createdAt,
            updatedAt,
            department: departmentName,
            faculty: facultyName
        },
        error: null
    })
}