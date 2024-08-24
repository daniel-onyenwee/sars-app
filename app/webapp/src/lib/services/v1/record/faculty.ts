import { AuthenticatedHeadersInit, API_VERSION, urlSortAndFilterAttacher } from "../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    FacultyModel,
    SortByOption
} from "../types.js"

interface FacultyServiceBody {
    name: string
}

export interface FacultySortByOption extends SortByOption {
    by: "name" | "updatedAt" | "createdAt"
}

export type FacultyFilterByOption = Partial<FacultyServiceBody>

interface GetFacultiesServiceBody extends Pagination {
    filter: FacultyFilterByOption
    sort: FacultySortByOption
}

export const createFaculty: AuthenticatedServiceHandle<FacultyServiceBody, FacultyModel> = async (data) => {
    let { accessToken, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/faculty`, {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateFaculty: AuthenticatedServiceHandle<Partial<FacultyServiceBody> & { id: string }, FacultyModel> = async (data) => {
    let { accessToken, id, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/faculty/${id}`, {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const getFaculties: AuthenticatedServiceHandle<Partial<GetFacultiesServiceBody>, FacultyModel[]> = async ({ accessToken, fetchApi, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ path: `/api/${API_VERSION}/record/faculty`, filter, sort, count, page })

    fetchApi = fetchApi || fetch

    let response = await fetchApi(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteFaculties: AuthenticatedServiceHandle<{ facultiesId: string[] }, null> = async (data) => {
    let { accessToken, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/faculty`, {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}