import { json } from "@/utils"
import { prismaClient } from "@/server"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ url }) => {
    let name = url.searchParams.get("name") || String()

    const facultiesCount = await prismaClient.faculty.count({
        where: {
            name: {
                contains: name,
                mode: "insensitive"
            },
        }
    })

    return json.success({
        ok: true,
        data: {
            count: facultiesCount
        },
        error: null
    })
}