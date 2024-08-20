import { json, prismaClient } from "@/utils"
import type { RequestHandler } from "./$types"
import type { $Enums } from "@prisma/client"

export const GET: RequestHandler = async ({ params, url }) => {
    let registerId = params.registerId

    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let name = url.searchParams.get("name") || String()
    let regno = url.searchParams.get("regno") || String()
    let gender = url.searchParams.get("gender") || String()
    let level = url.searchParams.get("level") || String()

    if (gender) {
        gender = ["MALE", "FEMALE"].includes(gender) ? gender : "MALE"
    }

    if (level) {
        level = /L_(100|200|300|400|500|600|700|800|900|10000)/.test(level) ? level : "L_100"
    }

    const attendanceRegisterStudentsCount = await prismaClient.attendanceRegisterStudent.count({
        where: {
            attendanceRegisterId: registerId,
            student: {
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
            }
        }
    })

    return json.success({
        ok: true,
        data: {
            count: attendanceRegisterStudentsCount
        },
        error: null
    })
}