import { generateStudentReport, json, prismaClient } from "@/utils"
import type { RequestHandler } from "./$types"

type ArrangeBy = "courseTitle" | "courseCode" | "semester"

type ArrangeOrder = "asc" | "desc"

type QueryOrderByObject = {
    course: Partial<Record<"code" | "title" | "semester", ArrangeOrder>>
}

export const GET: RequestHandler = async ({ params, url }) => {
    let studentId = params.studentId
    let session = params.session

    const studentCount = await prismaClient.student.findUnique({
        where: {
            id: studentId
        },
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
            regno: true,
            level: true,
            department: {
                select: {
                    name: true,
                    faculty: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    })

    if (!studentCount) {
        return json.fail({
            ok: false,
            error: {
                message: "Student not found",
                code: 3023
            },
            data: null
        })
    }

    let courseCode = url.searchParams.get("courseCode") || String()
    let courseTitle = url.searchParams.get("courseTitle") || String()
    let semester = url.searchParams.get("semester") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    if (semester) {
        semester = ["FIRST", "SECOND"].includes(semester) ? semester : "FIRST"
    }

    let searchBy: ArrangeBy = "courseTitle"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["courseTitle", "courseCode", "semester"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "courseTitle"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {
        course: {}
    }

    if (searchBy == "courseCode") {
        orderBy.course["code"] = searchOrder
    } else if (searchBy == "courseTitle") {
        orderBy.course["title"] = searchOrder
    } else {
        orderBy.course[searchBy] = searchOrder
    }

    const {
        surname,
        otherNames,
        regno,
        level,
        gender,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        }
    } = studentCount

    let report = await generateStudentReport({
        prismaClient,
        studentId,
        courseCode,
        semester,
        courseTitle,
        session,
        orderBy,
        getAllRecord,
        page,
        count
    })

    return json.success({
        ok: true,
        data: {
            metadata: {
                name: `${surname} ${otherNames}`.toUpperCase(),
                regno,
                surname,
                otherNames,
                level,
                gender,
                department: departmentName,
                faculty: facultyName,
            },
            report
        },
        error: null
    })
};