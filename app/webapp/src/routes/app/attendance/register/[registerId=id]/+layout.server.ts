import { getAttendanceRegisterById } from "@/services"
import type {
    IClassAttendance,
    AttendanceRegisterModel
} from "@/services"
import type { LayoutServerLoad } from "./$types"
import { error } from "@sveltejs/kit"

export const load = (async ({ locals, params, fetch }) => {
    let attendanceRegister: AttendanceRegisterModel & { classAttendances: IClassAttendance[] } = {} as AttendanceRegisterModel & { classAttendances: IClassAttendance[] }

    let { data } = await getAttendanceRegisterById({
        fetchApi: fetch,
        accessToken: locals.session.accessToken,
        id: params.registerId
    })

    if (data) {
        attendanceRegister = data
    } else {
        throw error(404, "Not Found")
    }

    return { attendanceRegister }
}) satisfies LayoutServerLoad