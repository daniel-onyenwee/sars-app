import { AuthenticatedHeadersInit, API_VERSION, urlSortAndFilterAttacher } from "../utils.js"
import type {
    AuthenticatedServiceHandle,
    Level,
    Pagination,
    SortByOption,
    DepartmentModel
} from "../types.js"

interface DepartmentServiceBody {
    name: string
    facultyId: string
    levels: Level[]
}

export interface DepartmentSortByOption extends SortByOption {
    by: "name" | "faculty" | "updatedAt" | "createdAt"
}

export interface DepartmentFilterByOption {
    name: string
    faculty: string
}

interface GetDepartmentsServiceBody extends Pagination {
    filter: Partial<DepartmentFilterByOption>
    sort: Partial<DepartmentSortByOption>
}

export const getDepartments: AuthenticatedServiceHandle<Partial<GetDepartmentsServiceBody>, DepartmentModel[]> = async ({ fetchApi, accessToken, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({
        path: `/api/${API_VERSION}/record/department`, filter, sort, count, page
    })

    fetchApi = fetchApi || fetch

    let response = await fetchApi(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const createDepartment: AuthenticatedServiceHandle<DepartmentServiceBody, DepartmentModel> = async (data) => {
    let { accessToken, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/department`, {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateDepartment: AuthenticatedServiceHandle<Partial<DepartmentServiceBody> & { id: string }, DepartmentModel> = async (data) => {
    let { accessToken, id, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/department/${id}`, {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}


export const deleteDepartments: AuthenticatedServiceHandle<{ departmentsId: string[] }, null> = async (data) => {
    let { accessToken, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/department`, {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}