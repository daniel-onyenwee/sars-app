import { env } from "$env/dynamic/public"

const DUMMY_URL_BASE = "http://localhost"

export const HeadersInit = (contentType: string | null = "application/json") => {
    let basicHeaders = {
        "Accept": "*/*",
        "User-Agent": "SARS Web App",
    }
    return { ...basicHeaders, ...(contentType ? { "Content-Type": "application/json" } : {}) }
}

export const AuthenticatedHeadersInit = (accessToken: string, contentType: string | null = "application/json") => {
    return {
        "Authorization": `Bearer ${accessToken}`,
        ...HeadersInit(contentType)
    }
}

export function urlFilterAttacher<FilterObjectType extends any>({ path, filter }: { path: string; filter?: FilterObjectType; }): string {
    let url = new URL(path, DUMMY_URL_BASE)

    for (const filterKey in (filter || {})) {
        let filterValue = Object(filter)[filterKey]

        if (filterValue) {
            url.searchParams.append(filterKey, filterValue.toString())
        }
    }

    return url.toString().replace(DUMMY_URL_BASE, String())
}

export function urlSortAndFilterAttacher<FilterObjectType extends any, SortObjectType extends Partial<{ by: any; ascending: boolean }> | undefined>({ path, filter, sort, count, page }: { path: string; filter?: FilterObjectType; sort?: SortObjectType; count?: "all" | number; page?: number }): string {
    let url = new URL(path, DUMMY_URL_BASE)

    if (count == "all") {
        url.searchParams.append("all", String())
    } else if (count && page) {
        url.searchParams.append("count", count.toString())
        url.searchParams.append("page", page.toString())
    }

    for (const filterKey in (filter || {})) {
        let filterValue = Object(filter)[filterKey]

        if (filterValue) {
            url.searchParams.append(filterKey, filterValue.toString())
        }
    }

    if (sort && sort.by && typeof sort.ascending == "boolean") {
        url.searchParams.append("by", sort.by.toString())
        url.searchParams.append("order", sort.ascending ? "asc" : "desc")
    }

    return url.toString().replace(DUMMY_URL_BASE, String())
}

export let SESSION_SECRET_KEY = env.PUBLIC_SESSION_SECRET_KEY