import type { PageServerLoad } from "./$types"
import { error } from "@sveltejs/kit"
import { getStudentById, type StudentModel } from "@/services"

export const load = (async ({ locals, params, fetch }) => {
    let student: StudentModel = {} as StudentModel
    let { data } = await getStudentById({ fetchApi: fetch, accessToken: locals.session.accessToken, id: params.studentId })

    if (data) {
        student = data
    } else {
        throw error(404, "Not Found");
    }

    return {
        student,
        academicSession: params.session
    }
}) satisfies PageServerLoad;