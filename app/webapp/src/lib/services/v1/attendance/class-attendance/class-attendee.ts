import {
    AuthenticatedHeadersInit,
    API_VERSION,
    urlSortAndFilterAttacher
} from "../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption,
    ClassAttendeeModel
} from "../../types.js"

interface ClassAttendeeServiceBody {
    classAttendees: {
        studentId: string
        courseClashId?: string
    }[]
}

export interface ClassAttendeeSortByOption extends SortByOption {
    by: "name" | "regno" | "courseClash"
}

export type ClassAttendeeFilterByOption = Record<"name" | "regno" | "courseClash", string>

interface GetClassAttendeeServiceBody extends Pagination {
    filter: Partial<ClassAttendeeFilterByOption>
    sort: Partial<ClassAttendeeSortByOption>
}

export const getClassAttendees: AuthenticatedServiceHandle<Partial<GetClassAttendeeServiceBody> & { classAttendanceId: string }, ClassAttendeeModel[]> = async ({ fetchApi, accessToken, count, page, sort, filter, classAttendanceId }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ path: `/api/${API_VERSION}/attendance/class-attendance/${classAttendanceId}/class-attendee`, filter, sort, count, page })

    fetchApi = fetchApi || fetch

    let response = await fetchApi(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const addClassAttendees: AuthenticatedServiceHandle<ClassAttendeeServiceBody & { classAttendanceId: string }, ClassAttendeeModel> = async (data) => {
    let { accessToken, classAttendanceId, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/attendance/class-attendance/${classAttendanceId}/class-attendee`, {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify({ ...otherData, status: "PRESENT" })
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteClassAttendees: AuthenticatedServiceHandle<{ classAttendanceId: string, classAttendeesId: string[] }, null> = async (data) => {
    let { accessToken, classAttendanceId, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/attendance/class-attendance/${classAttendanceId}/class-attendee`, {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}