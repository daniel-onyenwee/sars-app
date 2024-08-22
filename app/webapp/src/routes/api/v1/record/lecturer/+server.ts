import type { $Enums } from "@prisma/client"
import type { RequestHandler } from "./$types"
import { json } from "@/utils"
import { prismaClient } from "@/server"

interface LecturerRequestBody {
    surname: string
    otherNames: string
    username: string
    gender: $Enums.Gender
    departmentId: string
}

type ArrangeBy = "name" | "gender" | "username" | "updatedAt" | "createdAt" | "department" | "faculty"

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
    let username = url.searchParams.get("username") || String()
    let gender = url.searchParams.get("gender") || String()

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

    let searchBy: ArrangeBy = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "gender", "username", "updatedAt", "createdAt", "department", "faculty"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
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

    const lecturersQuery = await prismaClient.lecturer.findMany({
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
            username: {
                contains: username,
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

    let lecturers = lecturersQuery.map(({ department: { name: departmentName, faculty: { name: facultyName } }, surname, otherNames, ...otherData }) => {
        return ({
            name: `${surname} ${otherNames}`.toUpperCase(),
            surname,
            otherNames,
            ...otherData,
            department: departmentName,
            faculty: facultyName
        })
    })

    return json.success({
        ok: true,
        data: lecturers,
        error: null
    })
}

export const POST: RequestHandler = async ({ request }) => {
    let body: LecturerRequestBody | null = null

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

    if (!body.username) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'username'",
                code: 3018
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

    const lecturersCountByUsername = await prismaClient.lecturer.count({
        where: {
            username: body.username
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


    const lecturerQuery = await prismaClient.lecturer.create({
        data: {
            surname: body.surname,
            gender: body.gender,
            otherNames: body.otherNames,
            departmentId: body.departmentId,
            username: body.username
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

    const { id, surname, otherNames, username, gender, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = lecturerQuery

    return json.success({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            surname,
            otherNames,
            username,
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
    let body: { lecturersId: string[] }

    try {
        body = await request.json()
    } catch (error) {
        body = { lecturersId: [] }
    }

    if (body) {
        body.lecturersId = body.lecturersId || []
    }

    await prismaClient.lecturer.deleteMany({
        where: {
            id: {
                in: body.lecturersId
            }
        }
    })

    return json.success({
        ok: true,
        data: null,
        error: null
    })
}