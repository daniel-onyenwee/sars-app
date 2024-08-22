export async function sleep(millisecond: number = 1000) {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve()
        }, millisecond)
    })
}