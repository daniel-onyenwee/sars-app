import { json, prismaClient } from "@/utils"
import type { RequestHandler } from "./$types"
import type { $Enums } from "@prisma/client"

export const GET: RequestHandler = async ({ url }) => {
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let name = url.searchParams.get("name") || String()
    let username = url.searchParams.get("username") || String()
    let gender = url.searchParams.get("gender") || String()

    if (gender) {
        gender = ["MALE", "FEMALE"].includes(gender) ? gender : "MALE"
    }

    const lecturersCount = await prismaClient.lecturer.count({
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
        }
    })

    return json.success({
        ok: true,
        data: {
            count: lecturersCount
        },
        error: null
    })
}