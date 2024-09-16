import type { AuthModel } from "@/services"
import { redirect, type Handle } from "@sveltejs/kit"
import { env } from "$env/dynamic/private"
import { verify, decode, sign } from "@tsndr/cloudflare-worker-jwt"
import { json } from "@/utils"

export const handle: Handle = async ({ resolve, event }) => {
    let unauthorizedRoutes = [
        /^(\/app\/login)$/,
        /^(\/app\/setup)$/,
        /^(\/app\/session)$/,
        /^(\/api\/(v\d)\/auth\/login)$/,
        /^(\/api\/(v\d)\/report\/(course|lecturer|student)\/(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)\/((\d{4})\/(\d{4}))\/download)$/
    ]

    if (unauthorizedRoutes.some(route => route.test(decodeURIComponent(event.url.pathname)))) {
        return await resolve(event)
    }

    if (event.url.pathname.startsWith("/api")) {
        const authHeader = event.request.headers.get("authorization")
        const token = authHeader && authHeader.split(" ")[1]

        if (!token) {
            return json.fail({
                ok: false,
                error: {
                    message: "No authorization token",
                    code: 1001
                },
                data: null
            })
        }

        if (/^(\/api\/(v\d)\/auth\/reset\-token)$/.test(event.url.pathname)) {
            if (token != env.REFRESH_TOKEN_SECRET) {
                return json.fail({
                    ok: false,
                    error: {
                        message: "Invalid authorization token",
                        code: 1002
                    },
                    data: null
                })
            }

            return await resolve(event)
        }

        try {
            if (!(await verify(token, env.ACCESS_TOKEN_SECRET))) {
                throw new Error()
            }

            let { payload } = decode(token)

            if (!payload) {
                throw new Error()
            }

            if (Object(payload).password != env.ADMIN_PASSWORD) {
                throw new Error()
            }
        } catch {
            return json.fail({
                ok: false,
                error: {
                    message: "Invalid authorization token",
                    code: 1002
                },
                data: null
            })
        }

        return await resolve(event)
    }

    if (event.url.pathname.startsWith("/app")) {
        let session = event.cookies.get("session")

        if (!session) {
            redirect(307, "/app/login")
        }

        let sessionData = JSON.parse(session)

        if (sessionData.expiresIn <= Date.now()) {
            redirect(307, "/app/login")
        }

        event.locals = {
            session: sessionData as AuthModel
        }
    }

    return await resolve(event)
}