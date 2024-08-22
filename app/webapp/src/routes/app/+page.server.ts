import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load = (async ({ locals }) => {
    if (!locals.session) {
        redirect(307, "/app/login")
    }

    return {}
}) satisfies PageServerLoad