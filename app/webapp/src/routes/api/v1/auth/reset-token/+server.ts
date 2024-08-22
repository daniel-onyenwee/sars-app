import { addDays } from "date-fns"
import { json } from "@/utils"
import type { RequestHandler } from "./$types"
import { env } from "$env/dynamic/private"
import { sign } from "@tsndr/cloudflare-worker-jwt"

export const POST: RequestHandler = async () => {
    let exp = Math.floor(addDays(new Date(), 1).getUTCMilliseconds() / 1000) + (2 * (60 * 60))

    const accessToken = await sign({
        password: env.ADMIN_PASSWORD,
        exp
    }, env.ACCESS_TOKEN_SECRET)

    return json.success({
        ok: true,
        data: {
            refreshToken: env.REFRESH_TOKEN_SECRET,
            accessToken,
            expiresIn: exp
        },
        error: null
    })
}