import type { PageServerLoad } from "./$types"
import { error } from "@sveltejs/kit"
import { getCourseById, type CourseModel } from "@/services"

export const load = (async ({ locals, params, fetch }) => {
    let course: CourseModel = {} as CourseModel
    let { data } = await getCourseById({ fetchApi: fetch, accessToken: locals.session.accessToken, id: params.courseId })

    if (data) {
        course = data
    } else {
        throw error(404, "Not Found");
    }

    return {
        course,
        academicSession: params.session
    }
}) satisfies PageServerLoad;