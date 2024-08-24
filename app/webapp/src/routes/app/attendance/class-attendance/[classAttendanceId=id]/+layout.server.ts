import type { LayoutServerLoad } from "./$types"
import { getClassAttendanceById, type ClassAttendanceModel } from "@/services"
import { error } from "@sveltejs/kit"

export const load = (async ({ locals, params, fetch }) => {
    let classAttendance: ClassAttendanceModel = {} as ClassAttendanceModel

    let { data } = await getClassAttendanceById({
        fetchApi: fetch,
        accessToken: locals.session.accessToken,
        id: params.classAttendanceId
    })

    if (data) {
        classAttendance = data
    } else {
        throw error(404, "Not Found");
    }
    return { classAttendance };
}) satisfies LayoutServerLoad;