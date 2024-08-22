import { json } from "@/utils"
import { prismaClient } from "@/server"
import type { RequestHandler } from "./$types"
import type { $Enums } from "@prisma/client"

export const GET: RequestHandler = async ({ params, url }) => {
    let registerId = params.registerId

    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let name = url.searchParams.get("name") || String()
    let gender = url.searchParams.get("gender") || String()

    if (gender) {
        gender = ["MALE", "FEMALE"].includes(gender) ? gender : "MALE"
    }

    const attendanceRegisterLecturersCount = await prismaClient.attendanceRegisterLecturer.count({
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
                gender: gender ? {
                    equals: gender as $Enums.Gender
                } : undefined
            }
        }
    })

    return json.success({
        ok: true,
        data: {
            count: attendanceRegisterLecturersCount
        },
        error: null
    })
}