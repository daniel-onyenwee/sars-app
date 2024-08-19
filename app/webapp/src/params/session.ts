export function match(param: string) {
    let decodeParam = decodeURIComponent(param)

    return /^(\d{4})\/(\d{4})$/.test(decodeParam)
}