import { $Enums } from "@prisma/client"
import type { Applier } from "../../types.js"

const INSERT: Applier<"Student", "INSERT"> = async ({ dbClient, afterImage }) => {
    afterImage.otherNames = (afterImage.otherNames || String()).toUpperCase()
    afterImage.surname = (afterImage.surname || String()).toUpperCase()

    afterImage.gender = afterImage.gender || "MALE"
    if (!["MALE", "FEMALE"].includes(afterImage.gender)) {
        throw new Error("Invalid gender format")
    }

    afterImage.level = afterImage.level || "L_100"
    if (!/L_(100|200|300|400|500|600|700|800|900|1000)/.test(afterImage.level)) {
        throw new Error("Invalid level format")
    }

    const department = await dbClient.department.findUnique({
        where: {
            id: afterImage.departmentId
        },
        select: {
            id: true,
            levels: true
        }
    })

    if (!department) {
        throw new Error("Department not found")
    }

    const studentsCountByRegno = await dbClient.student.count({
        where: {
            regno: afterImage.regno
        }
    })

    if (studentsCountByRegno > 0) {
        throw new Error("Regno already exist")
    }

    if (!department.levels.includes(afterImage.level as $Enums.Level)) {
        throw new Error("Level not supported")
    }

    await dbClient.student.create({
        data: {
            id: afterImage.id,
            surname: afterImage.surname,
            gender: afterImage.gender,
            otherNames: afterImage.otherNames,
            departmentId: afterImage.departmentId,
            regno: afterImage.regno,
            level: afterImage.level,
            updatedAt: afterImage.updatedAt,
            createdAt: afterImage.createdAt,
            metadata: afterImage.metadata as any
        }
    })
}

const UPDATE: Applier<"Student", "UPDATE"> = async ({ dbClient, afterImage }) => {
    afterImage.otherNames = (afterImage.otherNames || String()).toUpperCase()
    afterImage.surname = (afterImage.surname || String()).toUpperCase()

    afterImage.gender = afterImage.gender || "MALE"
    if (!["MALE", "FEMALE"].includes(afterImage.gender)) {
        throw new Error("Invalid gender format")
    }

    afterImage.level = afterImage.level || "L_100"
    if (!/L_(100|200|300|400|500|600|700|800|900|1000)/.test(afterImage.level)) {
        throw new Error("Invalid level format")
    }

    const department = await dbClient.department.findUnique({
        where: {
            id: afterImage.departmentId
        },
        select: {
            id: true,
            levels: true
        }
    })

    if (!department) {
        throw new Error("Department not found")
    }

    const studentsCountByRegno = await dbClient.student.count({
        where: {
            regno: afterImage.regno,
            id: {
                not: {
                    equals: afterImage.id
                }
            }
        }
    })

    if (studentsCountByRegno > 0) {
        throw new Error("Regno already exist")
    }

    if (!department.levels.includes(afterImage.level as $Enums.Level)) {
        throw new Error("Level not supported")
    }

    await dbClient.student.update({
        where: {
            id: afterImage.id,
        },
        data: {
            surname: afterImage.surname,
            gender: afterImage.gender,
            otherNames: afterImage.otherNames,
            departmentId: afterImage.departmentId,
            regno: afterImage.regno,
            level: afterImage.level,
            updatedAt: afterImage.updatedAt,
            createdAt: afterImage.createdAt,
            metadata: afterImage.metadata as any
        }
    })
}

const DELETE: Applier<"Student", "DELETE"> = async ({ dbClient, beforeImage }) => {
    const studentsCount = await dbClient.student.count({
        where: {
            id: beforeImage.id
        }
    })

    if (studentsCount <= 0) {
        throw new Error("Student not found")
    }

    await dbClient.student.delete({
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