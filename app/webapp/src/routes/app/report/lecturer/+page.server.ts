import type { PageServerLoad } from "./$types"
import { getLecturers, type LecturerModel } from "@/services"

export const load = (async ({ locals, fetch }) => {
    let { data } = await getLecturers({ fetchApi: fetch, accessToken: locals.session.accessToken, count: "all" })

    if (data) {
        return {
            lecturers: data
        }
    } else {
        return {
            lecturers: [] as LecturerModel[]
        };
    }


}) satisfies PageServerLoad;