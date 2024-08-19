import { json } from "@sveltejs/kit"

export function success(data: any) {
    return json(data, { status: 200 })
}

export function fail(data: any) {
    return json(data, { status: 400 })
}