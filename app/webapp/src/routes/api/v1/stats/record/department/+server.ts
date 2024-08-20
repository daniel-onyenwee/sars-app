import { json, prismaClient } from "@/utils"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ url }) => {
    let name = url.searchParams.get("name") || String()
    let faculty = url.searchParams.get("faculty") || String()

    const departmentsCount = await prismaClient.department.count({
        where: {
            name: {
                contains: name,
                mode: "insensitive"
            },
            faculty: {
                name: {
                    contains: faculty,
                    mode: "insensitive"
                }
            }
        },
    })

    return json.success({
        ok: true,
        data: {
            count: departmentsCount
        },
        error: null
    })
}