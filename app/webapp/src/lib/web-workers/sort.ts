import { sort } from "fast-sort"

type SortMessageEvent = {
    mode: "REQUEST" | "RESPONSE"
    type: string
    payload: { [name: string]: any }[]
    sortOptions: {
        by: string
        ascending: boolean
    }
}

addEventListener('message', (e: MessageEvent<SortMessageEvent>) => {
    const { type, sortOptions, payload, mode } = e.data

    if (!sortOptions.by && mode != "REQUEST") return

    let result = payload
    let payloadKeys = Object.keys(result[0] || {})
    if (payloadKeys.includes(sortOptions.by)) {
        result = sortOptions.ascending
            ? sort(payload).asc((i) => i[sortOptions.by])
            : sort(payload).desc((i) => i[sortOptions.by]);
    }

    postMessage({ type, mode: "RESPONSE", payload: result })
})