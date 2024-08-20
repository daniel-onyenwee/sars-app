import type { $Enums } from "@prisma/client"
import type { RequestHandler } from "./$types"
import { json, prismaClient } from "@/utils"

interface StudentRequestBody {
    surname: string
    otherNames: string
    gender: $Enums.Gender
    regno: string
    departmentId: string
    level: $Enums.Level
}

type ArrangeBy = "name" | "gender" | "regno" | "level" | "password" | "updatedAt" | "createdAt" | "department" | "faculty"

type ArrangeOrder = "asc" | "desc"

interface surnameQueryOrderByObject {
    surname?: ArrangeOrder
}

interface otherNamesQueryOrderByObject {
    otherNames?: ArrangeOrder
}

type QueryOrderByObject = Partial<Omit<Record<ArrangeBy, ArrangeOrder>, "department" | "name" | "faculty">> & {
    department?: Partial<{
        name: ArrangeOrder,
        faculty: {
            name: ArrangeOrder,
        }
    }>,
} | (surnameQueryOrderByObject | otherNamesQueryOrderByObject)[]


export const GET: RequestHandler = async ({ url }) => {
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let name = url.searchParams.get("name") || String()
    let regno = url.searchParams.get("regno") || String()
    let gender = url.searchParams.get("gender") || String()
    let level = url.searchParams.get("level") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    if (gender) {
        gender = ["MALE", "FEMALE"].includes(gender) ? gender : "MALE"
    }

    if (level) {
        level = /L_(100|200|300|400|500|600|700|800|900|10000)/.test(level) ? level : "L_100"
    }

    let searchBy: ArrangeBy = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "gender", "regno", "level", "updatedAt", "createdAt", "department", "faculty"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {}
    if (searchBy == "department") {
        orderBy = {
            department: {
                name: searchOrder
            }
        }
    } else if (searchBy == "faculty") {
        orderBy = {
            department: {
                faculty: {
                    name: searchOrder
                }
            }
        }
    } else if (searchBy == "name") {
        orderBy = [
            {
                surname: searchOrder,
            },
            {
                otherNames: searchOrder
            }
        ]
    } else {
        orderBy[searchBy] = searchOrder
    }

    const studentsQuery = await prismaClient.student.findMany({
        where: {
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
            },
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
            ],
            level: level ? {
                equals: level as $Enums.Level
            } : undefined,
            gender: gender ? {
                equals: gender as $Enums.Gender
            } : undefined
        },
        orderBy,
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        select: {
            id: true,
            surname: true,
            otherNames: true,
            gender: true,
            level: true,
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
            },
            createdAt: true,
            updatedAt: true
        }
    })

    let students = studentsQuery.map(({ department: { name: departmentName, faculty: { name: facultyName } }, surname, otherNames, ...otherData }) => {
        return ({
            name: `${surname} ${otherNames}`.toUpperCase(),
            ...otherData,
            surname,
            otherNames,
            department: departmentName,
            faculty: facultyName
        })
    })

    return json.success({
        ok: true,
        data: students,
        error: null
    })

}

export const POST: RequestHandler = async ({ request }) => {
    let body: StudentRequestBody | null = null

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

    body.surname = (body.surname || String()).toUpperCase()

    if (!body.surname) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'surname'",
                code: 3016
            },
            data: null
        })
    }

    body.otherNames = (body.otherNames || String()).toUpperCase()

    if (!body.otherNames) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'otherNames'",
                code: 3017
            },
            data: null
        })
    }

    if (!body.regno) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'regno'",
                code: 3021
            },
            data: null
        })
    }

    if (!body.departmentId) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'departmentId'",
                code: 3009
            },
            data: null
        })
    }

    body.gender = body.gender || "MALE"
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

    body.level = body.level || "L_100"
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

    const department = await prismaClient.department.findUnique({
        where: {
            id: body.departmentId
        },
        select: {
            id: true,
            levels: true
        }
    })

    if (!department) {
        return json.fail({
            ok: false,
            error: {
                message: "Department not found",
                code: 3006
            },
            data: null
        })
    }

    const studentsCountByRegno = await prismaClient.student.count({
        where: {
            regno: body.regno
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

    if (!department.levels.includes(body.level as $Enums.Level)) {
        return json.fail({
            ok: false,
            error: {
                message: "Level not supported",
                code: 3014
            },
            data: null
        })
    }


    const user = await prismaClient.student.create({
        data: body,
        select: {
            id: true,

            surname: true,
            gender: true,
            otherNames: true,
            level: true,
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
            },
            createdAt: true,
            updatedAt: true

        }
    })

    const studentQuery = user
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
    } = studentQuery


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

export const DELETE: RequestHandler = async ({ request }) => {
    let body: { studentsId: string[] }

    try {
        body = await request.json()
    } catch (error) {
        body = { studentsId: [] }
    }

    if (body) {
        body.studentsId = body.studentsId || []
    }

    await prismaClient.student.deleteMany({
        where: {
            id: {
                in: body.studentsId
            },
        }
    })

    return json.success({
        ok: true,
        data: null,
        error: null
    })
}