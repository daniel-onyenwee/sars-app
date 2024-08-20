import type { RequestHandler } from "./$types"
import { json, prismaClient } from "@/utils"

export const GET: RequestHandler = async ({ params, url }) => {
    let classAttendanceId = params.classAttendanceId

    let name = url.searchParams.get("name") || String()
    let regno = url.searchParams.get("regno") || String()
    let courseClash = url.searchParams.get("courseClash") || String()

    const classAttendeesCount = await prismaClient.classAttendee.count({
        where: {
            classAttendanceId: classAttendanceId,
            courseClashAttendance: courseClash ? {
                course: {
                    code: {
                        contains: courseClash,
                        mode: "insensitive"
                    }
                }
            } : undefined,
            attendanceRegisterStudent: {
                student: {
                    regno: {
                        contains: regno,
                        mode: "insensitive"
                    },
                    OR: [
                        {
                            surname: {
                                contains: name,
                                mode: "insensitive"
                            }
                        },
                        {
                            otherNames: {
                                contains: name,
                                mode: "insensitive"
                            }
                        },
                        {
                            otherNames: {
                                in: name.split(/\s+/),
                                mode: "insensitive"
                            }
                        },
                        {
                            surname: {
                                in: name.split(/\s+/),
                                mode: "insensitive"
                            }
                        }
                    ]
                }
            }
        },
    })

    return json.success({
        ok: true,
        data: {
            count: classAttendeesCount
        },
        error: null
    })
}