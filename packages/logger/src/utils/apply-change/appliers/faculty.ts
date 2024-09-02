import type { Applier } from "../../types.js"

const INSERT: Applier<"Faculty", "INSERT"> = async ({ dbClient, afterImage }) => {
    afterImage.name = afterImage.name
        .toUpperCase()
        .replace("FACULTY OF", String())
        .replace("FACULTY", String())
        .trim()

    const facultiesCount = await dbClient.faculty.count({
        where: {
            name: {
                equals: afterImage.name,
                mode: "insensitive"
            }
        }
    })

    if (facultiesCount > 0) {
        throw new Error("Faculty already exist")
    }

    await dbClient.faculty.create({
        data: {
            id: afterImage.id,
            name: afterImage.name,
            updatedAt: afterImage.updatedAt,
            createdAt: afterImage.createdAt,
            metadata: afterImage.metadata as any
        }
    })
}

const UPDATE: Applier<"Faculty", "UPDATE"> = async ({ dbClient, afterImage }) => {
    afterImage.name = afterImage.name
        .toUpperCase()
        .replace("FACULTY OF", String())
        .replace("FACULTY", String())
        .trim()

    const facultiesCount = await dbClient.faculty.count({
        where: {
            id: afterImage.id
        }
    })

    if (facultiesCount <= 0) {
        throw new Error("Faculty not found")
    }

    const facultiesCountByName = await dbClient.faculty.count({
        where: {
            name: {
                equals: afterImage.name,
                mode: "insensitive"
            },
            id: {
                not: {
                    equals: afterImage.id
                }
            }
        }
    })

    if (facultiesCountByName > 0) {
        throw new Error("Faculty already exist")
    }

    await dbClient.faculty.update({
        where: {
            id: afterImage.id
        },
        data: {
            name: afterImage.name,
            updatedAt: afterImage.updatedAt,
            createdAt: afterImage.createdAt,
            metadata: afterImage.metadata as any
        }
    })
}

const DELETE: Applier<"Faculty", "DELETE"> = async ({ dbClient, beforeImage }) => {
    const facultiesCount = await dbClient.faculty.count({
        where: {
            id: beforeImage.id
        }
    })

    if (facultiesCount <= 0) {
        throw new Error("Faculty not found")
    }

    await dbClient.faculty.delete({
        where: {
            id: beforeImage.id
        }
    })
}

export default {
    INSERT,
    UPDATE,
    DELETE
}