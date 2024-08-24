import { AuthenticatedHeadersInit, API_VERSION, urlSortAndFilterAttacher } from "../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption,
    Gender,
    StudentModel,
    Level
} from "../types.js"

interface StudentServiceBody {
    surname: string
    otherNames: string
    gender: Gender
    regno: string
    departmentId: string
    level: Level
}

export interface StudentSortByOption extends SortByOption {
    by: "name" | "gender" | "regno" | "level" | "updatedAt" | "createdAt" | "department" | "faculty"
}

export interface StudentFilterByOption {
    name: string
    faculty: string
    level: string
    department: string
    gender: string
    regno: string
}

interface GetStudentsServiceBody extends Pagination {
    filter: Partial<StudentFilterByOption>
    sort: Partial<StudentSortByOption>
}

export const getStudents: AuthenticatedServiceHandle<Partial<GetStudentsServiceBody>, StudentModel[]> = async ({ fetchApi, accessToken, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({
        path: `/api/${API_VERSION}/record/student`, filter, sort, count, page
    })

    fetchApi = fetchApi || fetch

    let response = await fetchApi(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const getStudentById: AuthenticatedServiceHandle<{ id: string }, StudentModel> = async ({ fetchApi, accessToken, id }) => {
    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/student/${id}`, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const createStudent: AuthenticatedServiceHandle<StudentServiceBody, StudentModel> = async (data) => {
    let { accessToken, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/student`, {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateStudent: AuthenticatedServiceHandle<Partial<StudentServiceBody> & { id: string }, StudentModel> = async (data) => {
    let { accessToken, id, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/student/${id}`, {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteStudents: AuthenticatedServiceHandle<{ studentsId: string[] }, null> = async (data) => {
    let { accessToken, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/student`, {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}