import { json } from "@/utils"
import { prismaClient } from "@/server"
import type { RequestHandler } from "./$types"
import type { $Enums } from "@prisma/client"

type BasicArrangeBy = "name" | "gender" | "updatedAt" | "createdAt" | "department" | "faculty"

type ArrangeBy<T extends "Lecturer" | "Student" = "Lecturer"> = T extends "Student" ? "regno" | "level" | BasicArrangeBy : "username" | BasicArrangeBy

type ArrangeOrder = "asc" | "desc"

type surnameQueryOrderByObject<T extends "Lecturer" | "Student" = "Lecturer"> = T extends "Lecturer" ? {
    lecturer: {
        surname?: ArrangeOrder
    }
} : {
    student: {
        surname?: ArrangeOrder
    }
}

type otherNamesQueryOrderByObject<T extends "Lecturer" | "Student" = "Lecturer"> = T extends "Lecturer" ? {
    lecturer: {
        otherNames?: ArrangeOrder
    }
} : {
    student: {
        otherNames?: ArrangeOrder
    }
}

type QueryOrderByObject<T extends "Lecturer" | "Student" = "Lecturer"> = (T extends "Lecturer" ?
    {
        createdAt?: ArrangeOrder
        updatedAt?: ArrangeOrder
        lecturer: Partial<Omit<Record<ArrangeBy<T>, ArrangeOrder>, "department" | "name" | "faculty" | "createdAt" | "updatedAt">> & {
            department?: Partial<{
                name: ArrangeOrder,
                faculty: {
                    name: ArrangeOrder,
                }
            }>,
        }
    } :
    {
        createdAt?: ArrangeOrder
        updatedAt?: ArrangeOrder
        student: Partial<Omit<Record<ArrangeBy<T>, ArrangeOrder>, "department" | "name" | "faculty">> & {
            department?: Partial<{
                name: ArrangeOrder,
                faculty: {
                    name: ArrangeOrder,
                }
            }>,
        }
    }
) | (surnameQueryOrderByObject<T> | otherNamesQueryOrderByObject<T>)[]

export const GET: RequestHandler = async ({ params, url }) => {
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

    let searchBy: ArrangeBy<"Lecturer"> = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "gender", "updatedAt", "createdAt", "username", "department", "faculty"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject<"Lecturer"> = {
        lecturer: {}
    }

    if (searchBy == "department") {
        orderBy.lecturer = {
            department: {
                name: searchOrder
            }
        }
    } else if (searchBy == "faculty") {
        orderBy.lecturer = {
            department: {
                faculty: {
                    name: searchOrder
                }
            }
        }
    } else if (searchBy == "name") {
        orderBy = [
            {
                lecturer: {
                    surname: searchOrder,
                }
            },
            {
                lecturer: {
                    otherNames: searchOrder
                }
            }
        ]
    } else if (searchBy == "createdAt" || searchBy == "updatedAt") {
        delete Object(orderBy).lecturer
        orderBy[searchBy] = searchOrder
    } else {
        orderBy.lecturer = {
            [searchBy]: searchOrder
        }
    }

    const lecturersQuery = await prismaClient.attendanceRegisterLecturer.findMany({
        where: {
            attendanceRegisterId: registerId,
            lecturer: {
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
                username: {
                    contains: username,
                    mode: "insensitive"
                },
                gender: gender ? {
                    equals: gender as $Enums.Gender
                } : undefined
            }
        },
        select: {
            id: true,
            lecturer: {
                select: {
                    surname: true,
                    otherNames: true,
                    username: true,
                    gender: true,
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
                }
            },
            createdAt: true,
            updatedAt: true
        },
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        orderBy
    })

    let lecturers = lecturersQuery.map(({ lecturer: { department: { name: departmentName, faculty: { name: facultyName } }, surname, otherNames, ...otherLecturerData }, ...otherData }) => {
        return ({
            surname,
            otherNames,
            name: `${surname} ${otherNames}`.toUpperCase(),
            ...otherData,
            ...otherLecturerData,
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

export const POST: RequestHandler = async ({ params, request }) => {
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

    let body: { lecturersId: string[] }

    try {
        body = await request.json()
    } catch (error) {
        body = { lecturersId: [] }
    }

    if (!body.lecturersId) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'lecturersId'",
                code: 4003
            },
            data: null
        })
    }

    let filteredLecturersId = (await prismaClient.lecturer.findMany({
        where: {
            id: {
                in: body.lecturersId
            }
        },
        select: {
            id: true
        }
    })).map(({ id }) => ({ lecturerId: id }))

    await prismaClient.attendanceRegister.update({
        where: {
            id: registerId
        },
        data: {
            attendanceRegisterLecturers: {
                createMany: {
                    skipDuplicates: true,
                    data: filteredLecturersId
                }
            }
        }
    })

    return json.success({
        ok: true,
        data: null,
        error: null
    })
}

export const DELETE: RequestHandler = async ({ params, request }) => {
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

    let body: { attendanceRegisterLecturersId: string[] }

    try {
        body = await request.json()
    } catch (error) {
        body = { attendanceRegisterLecturersId: [] }
    }

    if (body) {
        body.attendanceRegisterLecturersId = body.attendanceRegisterLecturersId || []
    }

    await prismaClient.attendanceRegisterLecturer.deleteMany({
        where: {
            attendanceRegisterId: registerId,
            id: {
                in: body.attendanceRegisterLecturersId
            }
        }
    })

    return json.success({
        ok: true,
        data: null,
        error: null
    })
}