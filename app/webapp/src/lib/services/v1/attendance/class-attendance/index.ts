import {
    AuthenticatedHeadersInit,
    API_VERSION,
    urlFilterAttacher,
    urlSortAndFilterAttacher
} from "../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption,
    ClassAttendanceModel
} from "../../types.js"

interface ClassAttendanceServiceBody {
    attendanceRegisterId: string
    attendanceRegisterLecturerId: string
    date: Date
    startTime: Date
    endTime: Date
}

export interface ClassAttendanceSortByOption extends SortByOption {
    by: "courseTitle" | "courseCode" | "session" | "semester" | "department" | "faculty" | "level" | "date" | "startTime" | "endTime" | "updatedAt" | "createdAt" | "lecturerName"
}

export interface ClassAttendanceFilterByOption {
    level: string
    faculty: string
    date: string
    lecturerName: string
    endTime: string
    startTime: string
    department: string
    courseTitle: string
    semester: string
    session: string
    courseCode: string
}

interface GetClassAttendanceServiceBody extends Pagination {
    filter: Partial<ClassAttendanceFilterByOption>
    sort: Partial<ClassAttendanceSortByOption>
}

export const getClassAttendanceById: AuthenticatedServiceHandle<{ id: string }, ClassAttendanceModel> = async ({ fetchApi, accessToken, id }) => {
    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/attendance/class-attendance/${id}`, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const getClassAttendances: AuthenticatedServiceHandle<Partial<GetClassAttendanceServiceBody>, ClassAttendanceModel[]> = async ({ fetchApi, accessToken, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ path: `/api/${API_VERSION}/attendance/class-attendance`, filter, sort, count, page })

    fetchApi = fetchApi || fetch

    let response = await fetchApi(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const statsClassAttendances: AuthenticatedServiceHandle<Partial<{ filter: Partial<ClassAttendanceFilterByOption> }>, { count: number }> = async ({ fetchApi, accessToken, filter }) => {
    let url = urlFilterAttacher<typeof filter>({ path: `/api/${API_VERSION}/stats/attendance/class-attendance`, filter })
    fetchApi = fetchApi || fetch

    let response = await fetchApi(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}


export const createClassAttendance: AuthenticatedServiceHandle<ClassAttendanceServiceBody, ClassAttendanceModel> = async (data) => {
    let { accessToken, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/attendance/class-attendance`, {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateClassAttendance: AuthenticatedServiceHandle<Partial<ClassAttendanceServiceBody> & { id: string }, ClassAttendanceModel> = async (data) => {
    let { accessToken, fetchApi, id, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/attendance/class-attendance/${id}`, {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteClassAttendances: AuthenticatedServiceHandle<{ classAttendancesId: string[] }, null> = async (data) => {
    let { accessToken, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/attendance/class-attendance`, {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export * from "./class-attendee.js"