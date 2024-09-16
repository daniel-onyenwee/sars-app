import {
    AuthenticatedHeadersInit,
    API_VERSION,
    urlSortAndFilterAttacher
} from "../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption,
    CourseReportModel
} from "../types.js"

export interface CourseReportSortByOption extends SortByOption {
    by: "name" | "regno"
}

export type CourseReportFilterByOption = Record<"name" | "regno", string>

interface GenerateCourseReportServiceBody extends Pagination {
    filter: CourseReportFilterByOption
    sort: CourseReportSortByOption
}

export const generateCourseReport: AuthenticatedServiceHandle<Partial<GenerateCourseReportServiceBody> & { courseId: string, session: string }, CourseReportModel> =
    async ({ fetchApi, courseId, session, accessToken, count, page, sort, filter }) => {
        fetchApi = fetchApi || fetch

        let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ path: `/api/${API_VERSION}/report/course/${courseId}/${session}`, filter, sort, count, page })

        let response = await fetchApi(url, {
            method: "GET",
            headers: AuthenticatedHeadersInit(accessToken)
        })

        let responseBody = await response.json()

        return responseBody
    }

export const generateCourseReportBinary = async ({ fetchApi, courseId, session, count, page, sort, filter }: Partial<GenerateCourseReportServiceBody> & { fetchApi?: typeof fetch, courseId: string, session: string }): Promise<Blob> => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ path: `/api/${API_VERSION}/report/course/${courseId}/${session}/download`, filter, sort, count, page })

    fetchApi = fetchApi || fetch

    let response = await fetchApi(url, {
        method: "GET",
    })

    return await response.blob()
}