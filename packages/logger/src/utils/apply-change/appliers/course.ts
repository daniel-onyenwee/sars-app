import { $Enums } from "@prisma/client"
import { removeSpecialChar } from "../../remove-special-char.js"
import type { Applier } from "../../types.js"

const INSERT: Applier<"Course", "INSERT"> = async ({ dbClient, afterImage }) => {
    afterImage.title = afterImage.title.toUpperCase()
    afterImage.code = removeSpecialChar((afterImage.code || String()).toUpperCase())

    if (!/^([abcdefghijklmnopqrstwuxyz]){1,}(\d+)$/i.test(afterImage.code)) {
        throw new Error("Invalid course code format")
    }

    if (!/L_(100|200|300|400|500|600|700|800|900|1000)/.test(afterImage.level)) {
        throw new Error("Invalid level format")
    }

    if (!/FIRST|SECOND/.test(afterImage.semester)) {
        throw new Error("Invalid semester format")
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

    const coursesCountByCode = await dbClient.course.count({
        where: {
            code: afterImage.code
        }
    })

    if (coursesCountByCode > 0) {
        throw new Error("Course already exist")
    }

    if (!department.levels.includes(afterImage.level as $Enums.Level)) {
        throw new Error("Level not supported")
    }

    await dbClient.course.create({
        data: {
            id: afterImage.id,
            title: afterImage.title,
            code: afterImage.code,
            level: afterImage.level,
            semester: afterImage.semester,
            departmentId: afterImage.departmentId,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        }
    })
}

const UPDATE: Applier<"Course", "UPDATE"> = async ({ dbClient, afterImage }) => {
    afterImage.title = afterImage.title.toUpperCase()
    afterImage.code = removeSpecialChar((afterImage.code || String()).toUpperCase())

    if (!/^([abcdefghijklmnopqrstwuxyz]){1,}(\d+)$/i.test(afterImage.code)) {
        throw new Error("Invalid course code format")
    }

    if (!/L_(100|200|300|400|500|600|700|800|900|1000)/.test(afterImage.level)) {
        throw new Error("Invalid level format")
    }

    if (!/FIRST|SECOND/.test(afterImage.semester)) {
        throw new Error("Invalid semester format")
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

    const coursesCountByCode = await dbClient.course.count({
        where: {
            code: {
                equals: afterImage.code,
                mode: "insensitive"
            },
            id: {
                not: {
                    equals: afterImage.id
                }
            }
        }
    })

    if (coursesCountByCode > 0) {
        throw new Error("Course already exist")
    }

    if (!department.levels.includes(afterImage.level as $Enums.Level)) {
        throw new Error("Level not supported")
    }

    await dbClient.course.update({
        where: {
            id: afterImage.id,
        },
        data: {
            title: afterImage.title,
            code: afterImage.code,
            level: afterImage.level,
            semester: afterImage.semester,
            departmentId: afterImage.departmentId,
            createdAt: afterImage.createdAt,
            updatedAt: afterImage.updatedAt,
            metadata: afterImage.metadata as any
        }
    })
}

const DELETE: Applier<"Course", "DELETE"> = async ({ dbClient, beforeImage }) => {
    const coursesCount = await dbClient.course.count({
        where: {
            id: beforeImage.id
        }
    })

    if (coursesCount <= 0) {
        throw new Error("Course not found")
    }

    await dbClient.course.delete({
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