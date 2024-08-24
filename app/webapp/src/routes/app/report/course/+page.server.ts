import type { PageServerLoad } from "./$types"
import { getCourses, type CourseModel } from "@/services"

export const load = (async ({ locals, fetch }) => {
    let { data } = await getCourses({ fetchApi: fetch, accessToken: locals.session.accessToken, count: "all" })

    if (data) {
        return {
            courses: data
        }
    } else {
        return {
            courses: [] as CourseModel[]
        };
    }


}) satisfies PageServerLoad;