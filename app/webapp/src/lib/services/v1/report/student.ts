import {
    AuthenticatedHeadersInit,
    API_VERSION,
    urlSortAndFilterAttacher
} from "../utils.js"
import type { AuthenticatedServiceHandle, Pagination, SortByOption, StudentReportModel } from "../types.js"

export interface StudentReportSortByOption extends SortByOption {
    by: "courseTitle" | "courseCode" | "semester"
}

export type StudentReportFilterByOption = Record<"courseTitle" | "courseCode" | "semester", string>

interface GenerateStudentReportServiceBody extends Pagination {
    filter: StudentReportFilterByOption
    sort: StudentReportSortByOption
}

export const generateStudentReport: AuthenticatedServiceHandle<Partial<GenerateStudentReportServiceBody> & { studentId: string, session: string }, StudentReportModel> =
    async ({ fetchApi, studentId, session, accessToken, count, page, sort, filter }) => {
        fetchApi = fetchApi || fetch

        let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ path: `/api/${API_VERSION}/report/student/${studentId}/${session}`, filter, sort, count, page })

        let response = await fetchApi(url, {
            method: "GET",
            headers: AuthenticatedHeadersInit(accessToken)
        })

        let responseBody = await response.json()

        return responseBody
    }

export const generateStudentReportDownloadLink = ({ studentId, session, count, page, sort, filter }: Partial<GenerateStudentReportServiceBody> & { studentId: string, session: string }): string => {
    return urlSortAndFilterAttacher<typeof filter, typeof sort>({ path: `/api/${API_VERSION}/report/student/${studentId}/${session}/download`, filter, sort, count, page }).toString()
}