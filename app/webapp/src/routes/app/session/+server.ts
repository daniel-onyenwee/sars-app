import { env } from "$env/dynamic/public"
import type { RequestHandler } from "./$types"

const isAuthorized = (request: Request) => {
    const authHeader = request.headers.get("authorization")
    const token = authHeader && authHeader.split(" ")[1]
    if (!token || token != env.PUBLIC_SESSION_SECRET_KEY) {
        return false
    }

    return true
}

export const GET: RequestHandler = async ({ cookies, request }) => {
    if (!isAuthorized(request)) {
        return new Response(null, {
            status: 401
        })
    }

    let session = cookies.get("session")

    if (session) {
        return new Response(JSON.stringify({
            ok: true,
            data: JSON.parse(session),
            error: null
        }))
    }

    return new Response(JSON.stringify({
        ok: false,
        data: null,
        error: {
            code: 1006,
            message: "No session started"
        }
    }))
}

export const POST: RequestHandler = async ({ cookies, request }) => {
    if (!isAuthorized(request)) {
        return new Response(null, {
            status: 401
        })
    }

    let body = await request.json()

    cookies.set("session", JSON.stringify(body.data), {
        path: "/app"
    })

    return new Response(JSON.stringify({
        ok: true,
        data: body.data,
        error: null
    }))
}

export const DELETE: RequestHandler = async ({ cookies, request }) => {
    if (!isAuthorized(request)) {
        return new Response(null, {
            status: 401
        })
    }

    cookies.delete("session", { path: "/app" })

    return new Response(JSON.stringify({
        ok: true,
        data: null,
        error: null
    }))
}