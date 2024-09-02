import type { Applier } from "../../types.js"

const INSERT: Applier<"Department", "INSERT"> = async ({ dbClient, afterImage }) => {
    afterImage.name = afterImage.name || String()
    afterImage.name = afterImage.name
        .toUpperCase()
        .replace("DEPARTMENT OF", String())
        .replace("DEPARTMENT", String())
        .trim()

    const facultiesCount = await dbClient.faculty.count({
        where: {
            id: afterImage.facultyId
        }
    })

    if (facultiesCount <= 0) {
        throw new Error("Faculty not found")
    }

    const departmentsCountByName = await dbClient.department.count({
        where: {
            name: {
                equals: afterImage.name,
                mode: "insensitive"
            }
        }
    })

    if (departmentsCountByName > 0) {
        throw new Error("Department already exist")
    }

    afterImage.levels = Array.from(new Set(afterImage.levels || ["L_100"]))
    afterImage.levels = afterImage.levels.filter((level) => /L_(100|200|300|400|500|600|700|800|900|1000)/.test(level))
    afterImage.levels = afterImage.levels.length > 0 ? afterImage.levels : ["L_100"]

    await dbClient.department.create({
        data: {
            id: afterImage.id,
            facultyId: afterImage.facultyId,
            name: afterImage.name,
            levels: afterImage.levels,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        }
    })
}

const UPDATE: Applier<"Department", "UPDATE"> = async ({ dbClient, afterImage }) => {
    afterImage.name = afterImage.name || String()
    afterImage.name = afterImage.name
        .toUpperCase()
        .replace("DEPARTMENT OF", String())
        .replace("DEPARTMENT", String())
        .trim()

    const facultiesCount = await dbClient.faculty.count({
        where: {
            id: afterImage.facultyId
        }
    })

    if (facultiesCount <= 0) {
        throw new Error("Faculty not found")
    }

    const departmentsCountByName = await dbClient.department.count({
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

    if (departmentsCountByName > 0) {
        throw new Error("Department already exist")
    }

    afterImage.levels = Array.from(new Set(afterImage.levels || ["L_100"]))
    afterImage.levels = afterImage.levels.filter((level) => /L_(100|200|300|400|500|600|700|800|900|1000)/.test(level))
    afterImage.levels = afterImage.levels.length > 0 ? afterImage.levels : ["L_100"]

    await dbClient.department.update({
        where: {
            id: afterImage.id,
        },
        data: {
            facultyId: afterImage.facultyId,
            name: afterImage.name,
            levels: afterImage.levels,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        }
    })
}

const DELETE: Applier<"Department", "DELETE"> = async ({ dbClient, beforeImage }) => {
    const departmentsCount = await dbClient.department.count({
        where: {
            id: beforeImage.id
        }
    })

    if (departmentsCount <= 0) {
        throw new Error("Department not found")
    }

    await dbClient.department.delete({
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