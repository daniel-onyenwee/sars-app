import { AuthenticatedHeadersInit, API_VERSION, urlSortAndFilterAttacher } from "../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption,
    AttendanceRegisterModel
} from "../../types.js"

interface AttendanceRegisterServiceBody {
    courseId: string
    session: string
    decision?: any[]
    lecturerIds?: string[]
    studentIds?: string[]
}

export interface IClassAttendance {
    id: string;
    date: Date;
    startTime: Date;
    endTime: Date;
}

export interface AttendanceRegisterSortByOption extends SortByOption {
    by: "courseTitle" | "courseCode" | "session" | "semester" | "updatedAt" | "createdAt" | "department" | "faculty" | "level"
}

export interface AttendanceRegisterFilterByOption {
    level: string
    faculty: string
    department: string
    courseTitle: string
    semester: string
    session: string
    courseCode: string
}

interface GetAttendanceRegisterServiceBody extends Pagination {
    filter: Partial<AttendanceRegisterFilterByOption>
    sort: Partial<AttendanceRegisterSortByOption>
}

export const getAttendanceRegisterById: AuthenticatedServiceHandle<{ id: string }, AttendanceRegisterModel & { classAttendances: IClassAttendance[] }> = async ({ fetchApi, accessToken, id }) => {
    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/attendance/register/${id}`, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const getAttendanceRegisters: AuthenticatedServiceHandle<Partial<GetAttendanceRegisterServiceBody>, AttendanceRegisterModel[]> = async ({ fetchApi, accessToken, count, page, sort, filter }) => {
    fetchApi = fetchApi || fetch

    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({
        path: `/api/${API_VERSION}/attendance/register`, filter, sort, count, page
    })

    let response = await fetchApi(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const createAttendanceRegister: AuthenticatedServiceHandle<AttendanceRegisterServiceBody, AttendanceRegisterModel> = async (data) => {
    let { accessToken, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    otherData.decision = otherData.decision || [
        { "type": "SingleDecision", "value": 85, "operator": "gte", "property": "StudentPercentageOfClassAttended" }
    ]

    let response = await fetchApi(`/api/${API_VERSION}/attendance/register`, {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateAttendanceRegister: AuthenticatedServiceHandle<Partial<AttendanceRegisterServiceBody> & { id: string }, AttendanceRegisterModel> = async (data) => {
    let { accessToken, id, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/attendance/register/${id}`, {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteAttendanceRegisters: AuthenticatedServiceHandle<{ registersId: string[] }, null> = async (data) => {
    let { accessToken, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/attendance/register`, {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export * from "./attendance.js"
export * from "./record.js"