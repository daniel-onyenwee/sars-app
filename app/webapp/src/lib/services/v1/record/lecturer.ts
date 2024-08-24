import { AuthenticatedHeadersInit, API_VERSION, urlSortAndFilterAttacher } from "../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption,
    Gender,
    LecturerModel
} from "../types.js"

interface LecturerServiceBody {
    surname: string
    otherNames: string
    gender: Gender
    username: string
    departmentId: string
}

export interface LecturerSortByOption extends SortByOption {
    by: "name" | "gender" | "username" | "updatedAt" | "createdAt" | "department" | "faculty"
}

export interface LecturerFilterByOption {
    name: string
    faculty: string
    department: string
    gender: string
    username: string
}

interface GetLecturersServiceBody extends Pagination {
    filter: Partial<LecturerFilterByOption>
    sort: Partial<LecturerSortByOption>
}

export const getLecturers: AuthenticatedServiceHandle<Partial<GetLecturersServiceBody>, LecturerModel[]> = async ({ accessToken, fetchApi, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({
        path: `/api/${API_VERSION}/record/lecturer`, filter, sort, count, page
    })

    fetchApi = fetchApi || fetch

    let response = await fetchApi(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const getLecturerById: AuthenticatedServiceHandle<{ id: string }, LecturerModel> = async ({ accessToken, fetchApi, id }) => {
    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/lecturer/${id}`, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const createLecturer: AuthenticatedServiceHandle<LecturerServiceBody, LecturerModel> = async (data) => {
    let { accessToken, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/lecturer`, {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateLecturer: AuthenticatedServiceHandle<Partial<LecturerServiceBody> & { id: string }, LecturerModel> = async (data) => {
    let { accessToken, id, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/lecturer/${id}`, {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteLecturers: AuthenticatedServiceHandle<{ lecturersId: string[] }, null> = async (data) => {
    let { accessToken, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/lecturer`, {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}