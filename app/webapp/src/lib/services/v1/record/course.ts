import { AuthenticatedHeadersInit, API_VERSION, urlSortAndFilterAttacher } from "../utils.js"
import type {
    AuthenticatedServiceHandle,
    Level,
    Semester,
    Pagination,
    SortByOption,
    CourseModel
} from "../types.js"

interface CourseServiceBody {
    title: string
    code: string
    level: Level
    semester: Semester
    departmentId: string
}

export interface CourseSortByOption extends SortByOption {
    by: "title" | "code" | "semester" | "updatedAt" | "createdAt" | "department" | "faculty" | "level"
}

export interface CourseFilterByOption {
    level: string
    faculty: string
    department: string
    title: string
    semester: string
    code: string
}

interface GetCoursesServiceBody extends Pagination {
    filter: Partial<CourseFilterByOption>
    sort: Partial<CourseSortByOption>
}

export const getCourses: AuthenticatedServiceHandle<Partial<GetCoursesServiceBody>, CourseModel[]> = async ({ fetchApi, accessToken, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ path: `/api/${API_VERSION}/record/course`, filter, sort, count, page })

    fetchApi = fetchApi || fetch

    let response = await fetchApi(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const getCourseById: AuthenticatedServiceHandle<{ id: string }, CourseModel> = async ({ accessToken, id, fetchApi }) => {
    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/course/${id}`, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const createCourse: AuthenticatedServiceHandle<CourseServiceBody, CourseModel> = async (data) => {
    let { accessToken, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/course`, {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateCourse: AuthenticatedServiceHandle<Partial<CourseServiceBody> & { id: string }, CourseModel> = async (data) => {
    let { accessToken, id, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/course/${id}`, {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteCourses: AuthenticatedServiceHandle<{ coursesId: string[] }, null> = async (data) => {
    let { accessToken, fetchApi, ...otherData } = data

    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/record/course`, {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}