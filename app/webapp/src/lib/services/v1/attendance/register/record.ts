import { AuthenticatedHeadersInit, API_VERSION, urlSortAndFilterAttacher } from "../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption,
    AttendanceRegisterStudentModel,
    AttendanceRegisterLecturerModel
} from "../../types.js"
import type { LecturerFilterByOption, StudentFilterByOption } from "../../index.js"

export type AttendanceRegisterStudentFilterByOption = Omit<StudentFilterByOption, "password">

export interface AttendanceRegisterStudentSortByOption extends SortByOption {
    by: "name" | "gender" | "regno" | "level" | "updatedAt" | "createdAt" | "department" | "faculty"
}

export interface AttendanceRegisterLecturerSortByOption extends SortByOption {
    by: "name" | "gender" | "username" | "updatedAt" | "createdAt" | "department" | "faculty"
}

export type AttendanceRegisterLecturerFilterByOption = Omit<LecturerFilterByOption, "password">

interface GetAttendanceRegisterStudentServiceBody extends Pagination {
    filter: Partial<AttendanceRegisterStudentFilterByOption>
    sort: Partial<AttendanceRegisterStudentSortByOption>
}

interface GetAttendanceRegisterLecturerServiceBody extends Pagination {
    filter: Partial<AttendanceRegisterLecturerFilterByOption>
    sort: Partial<AttendanceRegisterLecturerSortByOption>
}

export const getAttendanceRegisterStudents: AuthenticatedServiceHandle<Partial<GetAttendanceRegisterStudentServiceBody> & { registerId: string }, AttendanceRegisterStudentModel[]> = async ({ fetchApi, accessToken, count, page, sort, filter, registerId }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ path: `/api/${API_VERSION}/attendance/register/${registerId}/student`, filter, sort, count, page })

    fetchApi = fetchApi || fetch

    let response = await fetchApi(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const addAttendanceRegisterStudents: AuthenticatedServiceHandle<{ registerId: string, studentsId: string[] }, null> = async (data) => {
    let { accessToken, registerId, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/attendance/register/${registerId}/student`, {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteAttendanceRegisterStudents: AuthenticatedServiceHandle<{ registerId: string, attendanceRegisterStudentsId: string[] }, null> = async (data) => {
    let { accessToken, registerId, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/attendance/register/${registerId}/student`, {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const getAttendanceRegisterLecturers: AuthenticatedServiceHandle<Partial<GetAttendanceRegisterLecturerServiceBody> & { registerId: string }, AttendanceRegisterLecturerModel[]> = async ({ fetchApi, accessToken, count, page, sort, filter, registerId }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ path: `/api/${API_VERSION}/attendance/register/${registerId}/lecturer`, filter, sort, count, page })

    fetchApi = fetchApi || fetch

    let response = await fetchApi(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const addAttendanceRegisterLecturers: AuthenticatedServiceHandle<{ registerId: string, lecturersId: string[] }, null> = async (data) => {
    let { accessToken, fetchApi, registerId, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/attendance/register/${registerId}/lecturer`, {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteAttendanceRegisterLecturers: AuthenticatedServiceHandle<{ registerId: string, attendanceRegisterLecturersId: string[] }, null> = async (data) => {
    let { accessToken, registerId, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/attendance/register/${registerId}/lecturer`, {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}