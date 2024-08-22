import { json } from "@/utils"
import { prismaClient } from "@/server"
import type { RequestHandler } from "./$types"
import type { $Enums } from "@prisma/client"

export const GET: RequestHandler = async ({ url }) => {
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let code = url.searchParams.get("code") || String()
    let title = url.searchParams.get("title") || String()
    let level = url.searchParams.get("level") || String()
    let semester = url.searchParams.get("semester") || String()

    if (semester) {
        semester = ["FIRST", "SECOND"].includes(semester) ? semester : "FIRST"
    }

    if (level) {
        level = /L_(100|200|300|400|500|600|700|800|900|10000)/.test(level) ? level : "L_100"
    }

    const coursesCount = await prismaClient.course.count({
        where: {
            title: {
                contains: title,
                mode: "insensitive"
            },
            code: {
                contains: code,
                mode: "insensitive"
            },
            semester: semester ? {
                equals: semester as $Enums.Semester,
            } : undefined,
            level: level ? {
                equals: level as $Enums.Level
            } : undefined,
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
            }
        }
    })

    return json.success({
        ok: true,
        data: {
            count: coursesCount
        },
        error: null
    })
}