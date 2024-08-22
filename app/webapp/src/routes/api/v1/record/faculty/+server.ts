import type { RequestHandler } from "./$types"
import { json } from "$lib/utils"
import { prismaClient } from "@/server"

type ArrangeBy = "name" | "updatedAt" | "createdAt"

type ArrangeOrder = "asc" | "desc"

type QueryOrderByObject = Partial<Record<ArrangeBy, ArrangeOrder>>

interface FacultyRequestBody {
    name: string
}

export const GET: RequestHandler = async ({ url }) => {
    let name = url.searchParams.get("name") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    let searchBy: ArrangeBy = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "updatedAt", "createdAt"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {}
    orderBy[searchBy] = searchOrder

    const faculties = await prismaClient.faculty.findMany({
        where: {
            name: {
                contains: name,
                mode: "insensitive"
            },
        },
        orderBy,
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        select: {
            name: true,
            id: true,
            createdAt: true,
            updatedAt: true
        }
    })

    return json.success({
        ok: true,
        data: faculties,
        error: null
    })
}

export const POST: RequestHandler = async ({ request }) => {
    let body: FacultyRequestBody | null = null

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

    body.name = body.name || String()
    body.name = body.name = body.name
        .toUpperCase()
        .replace("FACULTY OF", String())
        .replace("FACULTY", String())
        .trim()

    if (!body.name) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'name'",
                code: 3000
            },
            data: null
        })

    }

    const facultiesCount = await prismaClient.faculty.count({
        where: {
            name: {
                equals: body.name,
                mode: "insensitive"
            }
        }
    })

    if (facultiesCount > 0) {
        return json.fail({
            ok: false,
            error: {
                message: "Faculty already exist",
                code: 3001
            },
            data: null
        })
    }

    const faculty = await prismaClient.faculty.create({
        data: {
            name: body.name
        },
        select: {
            name: true,
            id: true,
            createdAt: true,
            updatedAt: true
        }
    })

    return json.success({
        ok: true,
        data: faculty,
        error: null
    })
}

export const DELETE: RequestHandler = async ({ request }) => {
    let body: { facultiesId: string[] }

    try {
        body = await request.json()
    } catch (error) {
        body = { facultiesId: [] }
    }

    if (body) {
        body.facultiesId = body.facultiesId || []
    }

    await prismaClient.faculty.deleteMany({
        where: {
            id: {
                in: body.facultiesId
            }
        }
    })

    return json.success({
        ok: true,
        data: null,
        error: null
    })
}