import {
    AuthenticatedHeadersInit,
    API_VERSION,
    urlSortAndFilterAttacher
} from "../utils.js"
import type { AuthenticatedServiceHandle, Pagination, SortByOption, LecturerReportModel } from "../types.js"

export interface LecturerReportSortByOption extends SortByOption {
    by: "courseTitle" | "courseCode" | "semester"
}

export type LecturerReportFilterByOption = Record<"courseTitle" | "courseCode" | "semester", string>

interface GenerateLecturerReportServiceBody extends Pagination {
    filter: LecturerReportFilterByOption
    sort: LecturerReportSortByOption
}

export const generateLecturerReport: AuthenticatedServiceHandle<Partial<GenerateLecturerReportServiceBody> & { lecturerId: string, session: string }, LecturerReportModel> =
    async ({ fetchApi, lecturerId, session, accessToken, count, page, sort, filter }) => {
        fetchApi = fetchApi || fetch

        let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ path: `/api/${API_VERSION}/report/lecturer/${lecturerId}/${session}`, filter, sort, count, page })

        let response = await fetchApi(url, {
            method: "GET",
            headers: AuthenticatedHeadersInit(accessToken)
        })

        let responseBody = await response.json()

        return responseBody
    }

export const generateLecturerReportDownloadLink = ({ lecturerId, session, count, page, sort, filter }: Partial<GenerateLecturerReportServiceBody> & { lecturerId: string, session: string }): string => {
    return urlSortAndFilterAttacher<typeof filter, typeof sort>({ path: `/api/${API_VERSION}/report/lecturer/${lecturerId}/${session}/download`, filter, sort, count, page }).toString()
}