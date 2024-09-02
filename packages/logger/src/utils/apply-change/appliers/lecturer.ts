import type { Applier } from "../../types.js"

const INSERT: Applier<"Lecturer", "INSERT"> = async ({ dbClient, afterImage }) => {
    afterImage.otherNames = (afterImage.otherNames || String()).toUpperCase()
    afterImage.surname = (afterImage.surname || String()).toUpperCase()

    afterImage.gender = afterImage.gender || "MALE"
    if (!["MALE", "FEMALE"].includes(afterImage.gender)) {
        throw new Error("Invalid gender format")
    }

    const departmentsCount = await dbClient.department.count({
        where: {
            id: afterImage.departmentId
        }
    })

    if (departmentsCount <= 0) {
        throw new Error("Department not found")
    }

    const lecturersCountByUsername = await dbClient.lecturer.count({
        where: {
            username: afterImage.username
        }
    })

    if (lecturersCountByUsername > 0) {
        throw new Error("Username already exist")
    }

    await dbClient.lecturer.create({
        data: {
            id: afterImage.id,
            surname: afterImage.surname,
            gender: afterImage.gender,
            otherNames: afterImage.otherNames,
            departmentId: afterImage.departmentId,
            username: afterImage.username,
            updatedAt: afterImage.updatedAt,
            createdAt: afterImage.createdAt,
            metadata: afterImage.metadata as any
        }
    })
}

const UPDATE: Applier<"Lecturer", "UPDATE"> = async ({ dbClient, afterImage }) => {
    afterImage.otherNames = (afterImage.otherNames || String()).toUpperCase()
    afterImage.surname = (afterImage.surname || String()).toUpperCase()

    afterImage.gender = afterImage.gender || "MALE"
    if (!["MALE", "FEMALE"].includes(afterImage.gender)) {
        throw new Error("Invalid gender format")
    }

    const departmentsCount = await dbClient.department.count({
        where: {
            id: afterImage.departmentId
        }
    })

    if (departmentsCount <= 0) {
        throw new Error("Department not found")
    }

    const lecturersCountByUsername = await dbClient.lecturer.count({
        where: {
            id: {
                not: {
                    equals: afterImage.id
                }
            },
            username: afterImage.username
        }
    })

    if (lecturersCountByUsername > 0) {
        throw new Error("Username already exist")
    }

    await dbClient.lecturer.update({
        where: {
            id: afterImage.id,
        },
        data: {
            surname: afterImage.surname,
            gender: afterImage.gender,
            otherNames: afterImage.otherNames,
            departmentId: afterImage.departmentId,
            username: afterImage.username,
            updatedAt: afterImage.updatedAt,
            createdAt: afterImage.createdAt,
            metadata: afterImage.metadata as any
        }
    })
}

const DELETE: Applier<"Lecturer", "DELETE"> = async ({ dbClient, beforeImage }) => {
    const lecturersCount = await dbClient.lecturer.count({
        where: {
            id: beforeImage.id
        }
    })

    if (lecturersCount <= 0) {
        throw new Error("Lecturer not found")
    }

    await dbClient.lecturer.delete({
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