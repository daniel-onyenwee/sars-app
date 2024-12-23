import { generateLecturerReport, json } from "@/utils"
import type { RequestHandler } from "./$types"
import { prismaClient, createExcelFile } from "@/server"

type ArrangeBy = "courseTitle" | "courseCode" | "semester"

type ArrangeOrder = "asc" | "desc"

type QueryOrderByObject = {
    course: Partial<Record<"code" | "title" | "semester", ArrangeOrder>>
}

export const GET: RequestHandler = async ({ params, url }) => {
    let lecturerId = params.lecturerId
    let session = params.session

    const lecturerCount = await prismaClient.lecturer.findUnique({
        where: {
            id: lecturerId
        },
        select: {
            username: true,
        }
    })

    if (!lecturerCount) {
        let fileName = `untitled_${session}_Report`

        let excelFileColumns = [
            { header: "Course title", key: "courseTitle", width: 35 },
            { header: "Course code", key: "courseCode", width: 15 },
            { header: "Semester", key: "semester", width: 15 },
            { header: "Total classes", key: "totalClasses", width: 15 },
            { header: "Total classes in hour", key: "totalClassesInHour", width: 23 },
            { header: "Classes taught", key: "classesTaught", width: 20 },
            { header: "Classes taught in hour", key: "classesTaughtInHour", width: 23 },
            { header: "Classes taught percentage", width: 28, key: "classesTaughtPercentage" }
        ]

        let fileData = createExcelFile({
            title: fileName,
            created: new Date(),
            firstHeader: fileName,
            creator: "SAR system",
            columns: excelFileColumns
        }, [])

        return new Response(fileData, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.ms-excel",
                "Content-disposition": `attachment; filename=${fileName}.xlsx`
            }
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

    let report = await generateLecturerReport({
        prismaClient,
        lecturerId,
        courseCode,
        semester,
        courseTitle,
        session,
        orderBy,
        getAllRecord,
        page,
        count
    })

    let fileName = `${lecturerCount.username}_${session}_Report`

    let excelFileColumns = [
        { header: "Course title", key: "courseTitle", width: 35 },
        { header: "Course code", key: "courseCode", width: 15 },
        { header: "Semester", key: "semester", width: 15 },
        { header: "Total classes", key: "totalClasses", width: 15 },
        { header: "Total classes in hour", key: "totalClassesInHour", width: 23 },
        { header: "Classes taught", key: "classesTaught", width: 20 },
        { header: "Classes taught in hour", key: "classesTaughtInHour", width: 23 },
        { header: "Classes taught percentage", width: 28, key: "classesTaughtPercentage" }
    ]

    let fileData = createExcelFile({
        title: fileName,
        created: new Date(),
        firstHeader: fileName,
        creator: "SAR system",
        columns: excelFileColumns
    }, report)

    return new Response(fileData, {
        status: 200,
        headers: {
            "Content-Type": "application/vnd.ms-excel",
            "Content-disposition": `attachment; filename=${fileName}.xlsx`
        }
    })
};