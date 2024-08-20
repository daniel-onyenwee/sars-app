import type { RequestHandler } from "./$types"
import { prismaClient, json } from "$lib/utils"

interface FacultyIDRequestBody {
    name: string
}

export const GET: RequestHandler = async ({ params }) => {
    let facultyId = params.facultyId;

    let faculty = await prismaClient.faculty.findUnique({
        where: {
            id: facultyId
        },
        select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true
        }
    })

    if (!faculty) {
        return json.fail({
            ok: false,
            error: {
                message: "Faculty not found",
                code: 3002
            },
            data: null
        })

    }

    return json.success({
        ok: true,
        data: faculty,
        error: null
    });
};

export const PATCH: RequestHandler = async ({ params, request }) => {
    let facultyId = params.facultyId;

    let body: Partial<FacultyIDRequestBody> = {}

    try {
        body = await request.json()
    } catch (error) {
        body = {}
    }

    body.name = body.name || String()
    body.name = body.name
        .toUpperCase()
        .replace("FACULTY OF", String())
        .replace("FACULTY", String())
        .trim()

    const facultiesCount = await prismaClient.faculty.count({
        where: {
            id: facultyId
        }
    })

    if (facultiesCount <= 0) {
        return json.fail({
            ok: false,
            error: {
                message: "Faculty not found",
                code: 3002
            },
            data: null
        })
    }

    let updateData: Partial<FacultyIDRequestBody> = {}

    if (body.name) {
        const facultiesCountByName = await prismaClient.faculty.count({
            where: {
                name: body.name,
                id: {
                    not: {
                        equals: facultyId
                    }
                }
            }
        })

        if (facultiesCountByName > 0) {
            return json.fail({
                ok: false,
                error: {
                    message: "Faculty already exist",
                    code: 3001
                },
                data: null
            })
        }

        updateData.name = body.name
    }

    const faculty = await prismaClient.faculty.update({
        where: {
            id: facultyId
        },
        data: updateData,
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

export const DELETE: RequestHandler = async ({ params }) => {
    let facultyId = params.facultyId;

    let facultiesCount = await prismaClient.faculty.count({
        where: {
            id: facultyId
        }
    })

    if (facultiesCount <= 0) {
        return json.fail({
            ok: false,
            error: {
                message: "Faculty not found",
                code: 3002
            },
            data: null
        })
    }

    const faculty = await prismaClient.faculty.delete({
        where: {
            id: facultyId
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