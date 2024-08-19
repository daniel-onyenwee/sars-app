export function removeSpecialChar(text: string) {
    if (text.search(/\W/) >= 0) {
        return removeSpecialChar(text.replace(/\W/, String()))
    } else {
        return text
    }
}