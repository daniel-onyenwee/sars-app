import { generateCourseReport, json } from "@/utils"
import type { RequestHandler } from "./$types"
import { format } from "date-fns"
import { prismaClient, createExcelFile } from "@/server"

type ArrangeBy = "name" | "regno"

type ArrangeOrder = "asc" | "desc"

interface surnameQueryOrderByObject {
    student: {
        surname?: ArrangeOrder
    }
}

interface otherNamesQueryOrderByObject {
    student: {
        otherNames?: ArrangeOrder
    }
}

type QueryOrderByObject = {
    student: {
        regno?: ArrangeOrder
    }
} | (surnameQueryOrderByObject | otherNamesQueryOrderByObject)[]

export const GET: RequestHandler = async ({ params, url }) => {
    let courseId = params.courseId
    let session = params.session

    const courseCount = await prismaClient.course.findUnique({
        where: {
            id: courseId
        },
        select: {
            id: true,
            title: true,
            code: true,
            semester: true,
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
            },
        }
    })

    if (!courseCount) {
        return json.fail({
            ok: false,
            error: {
                message: "Course not found",
                code: 3015
            },
            data: null
        })
    }

    let name = url.searchParams.get("name") || String()
    let regno = url.searchParams.get("regno") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    let searchBy: ArrangeBy = "name"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "regno"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "name"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {
        student: {}
    }

    if (searchBy == "regno") {
        orderBy.student["regno"] = searchOrder
    } else if (searchBy == "name") {
        orderBy = [
            {
                student: {
                    surname: searchOrder,
                }
            },
            {
                student: {
                    otherNames: searchOrder
                }
            }
        ]
    }

    let report = await generateCourseReport({
        prismaClient,
        courseId,
        name,
        regno,
        session,
        orderBy,
        getAllRecord,
        page,
        count
    })

    let fileName = `${courseCount.code}_${session}_Report`

    let fileData = await createExcelFile({
        title: fileName,
        created: new Date(),
        firstHeader: fileName,
        creator: "SAR system",
        columns: [
            { header: "Name", key: "name", width: 35 },
            { header: "Regno", key: "regno", width: 20 },
            { header: "Decision", key: "decision", width: 10 },
            ...(report.classesDate.map(({ id, date, endTime, startTime }) => {
                return ({
                    key: id,
                    width: 22,
                    header: `${format(date, "LL/dd/yyyy")}\n${format(startTime, "hh:mm aaa")} - ${format(endTime, "hh:mm aaa")}`
                })
            })),
            { header: "Classes attended", key: "classesAttended", width: 20 },
            { header: "Classes attended percentage", width: 30, key: "classesAttendedPercentage" }
        ]
    }, report.attendances)

    return new Response(fileData, {
        status: 200,
        headers: {
            "Content-Type": "application/vnd.ms-excel",
            "Content-disposition": `attachment; filename=${fileName}.xlsx`
        }
    })
}