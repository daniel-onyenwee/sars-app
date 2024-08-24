import {
    AuthenticatedHeadersInit,
    API_VERSION,
    urlSortAndFilterAttacher
} from "../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption,
    AttendanceRegisterAttendanceModel,
    ClassAttendeeModel
} from "../../types.js"

interface AttendanceRegisterAttendanceServiceBody {
    classAttendanceId: string
    attendanceRegisterStudentId: string
    status: "PRESENT" | "ABSENT"
}

export interface AttendanceRegisterAttendanceSortByOption extends SortByOption {
    by: "name" | "regno"
}

export type AttendanceRegisterAttendanceFilterByOption = Record<"name" | "regno", string>

interface GetAttendanceRegisterAttendanceServiceBody extends Pagination {
    filter: Partial<AttendanceRegisterAttendanceFilterByOption>
    sort: Partial<AttendanceRegisterAttendanceSortByOption>
}

export const getAttendanceRegisterAttendances: AuthenticatedServiceHandle<Partial<GetAttendanceRegisterAttendanceServiceBody> & { registerId: string }, AttendanceRegisterAttendanceModel[]> = async ({ fetchApi, accessToken, count, page, sort, filter, registerId }) => {
    fetchApi = fetchApi || fetch

    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ path: `/api/${API_VERSION}/attendance/register/${registerId}/attendance`, filter, sort, count, page })

    let response = await fetchApi(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateAttendanceRegisterAttendance: AuthenticatedServiceHandle<AttendanceRegisterAttendanceServiceBody & { registerId: string }, Omit<ClassAttendeeModel, "status" | "courseClash">> = async (data) => {
    let { accessToken, fetchApi, registerId, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/attendance/register/${registerId}/attendance`, {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}