import express from "express"

interface ServerEnv {
    DATABASE_URL: string
    ACCESS_TOKEN_SECRET: string
    ADMIN_PASSWORD: string
    REFRESH_TOKEN_SECRET: string
    PUBLIC_SESSION_SECRET_KEY: string
}

export async function setupServer(env: ServerEnv, port: number) {
    const app = express()

    for (const key in env) {
        Object(process.env)[key] = Object(env)[key]
    }

    let { handler } = await import("@sars/webapp/build/handler.js")

    app
        .use(handler)
        .listen(port)

}
