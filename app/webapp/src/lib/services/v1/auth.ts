import {
    AuthenticatedHeadersInit,
    API_VERSION,
    HeadersInit,
    SESSION_SECRET_KEY
} from "./utils.js"
import type { AuthModel, AuthenticatedServiceHandle, ServiceHandle } from "./types.js"

export interface LoginServiceBody {
    password: string,
    platform?: "Electron" | "Browser",
    systemPassword?: string
}

export const login: ServiceHandle<LoginServiceBody, AuthModel> = async ({ fetchApi, ...data }) => {
    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/auth/login`, {
        body: JSON.stringify(data),
        method: "POST",
        headers: HeadersInit()
    })

    let responseBody = await response.json()

    if (responseBody.ok) {
        let sessionResponse = await fetchApi("/app/session", {
            body: JSON.stringify(responseBody),
            method: "POST",
            headers: AuthenticatedHeadersInit(SESSION_SECRET_KEY)
        })

        if (sessionResponse.status == 401) {
            return {
                ok: false,
                data: null,
                error: {
                    code: 1005,
                    message: "Session unset"
                }
            }
        }
    }

    return responseBody
}

export const resetToken: AuthenticatedServiceHandle<{ platform?: "Electron" | "Browser", systemPassword?: string }, AuthModel> = async ({ fetchApi, ...data }) => {
    fetchApi = fetchApi || fetch

    let response = await fetchApi(`/api/${API_VERSION}/auth/reset-token`, {
        method: "POST",
        headers: AuthenticatedHeadersInit(data.accessToken)
    })

    let responseBody = await response.json()

    if (responseBody.ok) {
        let sessionResponse = await fetchApi("/app/session", {
            body: JSON.stringify(responseBody),
            method: "POST",
            headers: AuthenticatedHeadersInit(SESSION_SECRET_KEY)
        })

        if (sessionResponse.status == 401) {
            return {
                ok: false,
                data: null,
                error: {
                    code: 1005,
                    message: "Session unset"
                }
            }
        }
    }

    return responseBody
}