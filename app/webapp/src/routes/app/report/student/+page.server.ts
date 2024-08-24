import type { PageServerLoad } from "./$types"
import { getStudents, type StudentModel } from "@/services"

export const load = (async ({ locals, fetch }) => {
    let { data } = await getStudents({ fetchApi: fetch, accessToken: locals.session.accessToken, count: "all" })

    if (data) {
        return {
            students: data
        }
    } else {
        return {
            students: [] as StudentModel[]
        };
    }


}) satisfies PageServerLoad;