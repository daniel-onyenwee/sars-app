import type { PageServerLoad } from "./$types"
import { error } from "@sveltejs/kit"
import { getLecturerById, type LecturerModel } from "@/services"

export const load = (async ({ locals, params, fetch }) => {
    let lecturer: LecturerModel = {} as LecturerModel
    let { data } = await getLecturerById({ fetchApi: fetch, accessToken: locals.session.accessToken, id: params.lecturerId })

    if (data) {
        lecturer = data
    } else {
        throw error(404, "Not Found");
    }

    return {
        lecturer,
        academicSession: params.session
    }
}) satisfies PageServerLoad;