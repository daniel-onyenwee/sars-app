import { json } from "@/utils"
import type { RequestHandler } from "./$types"
import { env } from "$env/dynamic/private"
import { sign } from "@tsndr/cloudflare-worker-jwt"
import { addDays } from "date-fns"

interface LoginRequestBody {
    password: string,
    platform?: "Electron" | "Browser",
    systemPassword?: string
}

export const POST: RequestHandler = async ({ request }) => {
    let body: LoginRequestBody | null = null

    try {
        body = await request.json()
    } catch (error) {
        body = null
    }

    if (!body) {
        return json.fail({
            ok: false,
            error: {
                message: "Request body missing",
                code: 1004
            },
            data: null
        })
    }

    if (!body.password) {
        return json.fail({
            ok: false,
            error: {
                message: "Missing parameter 'password'",
                code: 2000
            },
            data: null
        })
    }

    if ((body.password != env.ADMIN_PASSWORD && (!body.platform || body.platform == "Browser")) ||
        (body.platform == "Electron" && body.password != body.systemPassword)) {
        return json.fail({
            ok: false,
            error: {
                message: "Incorrect password",
                code: 2001
            },
            data: null
        })
    }

    let expiresIn = addDays(new Date(), 1)

    let exp = Math.floor(expiresIn.getTime() / 1000) + (2 * (60 * 60))

    const accessToken = await sign({
        password: env.ADMIN_PASSWORD,
        exp
    }, env.ACCESS_TOKEN_SECRET)

    return json.success({
        ok: true,
        data: {
            refreshToken: env.REFRESH_TOKEN_SECRET,
            accessToken,
            expiresIn
        },
        error: null
    })
}