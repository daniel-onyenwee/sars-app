export function removeUnderscore(text: string, replaceText: string = String()) {
    const UNDERSCORE = "_"

    text = text.replace(UNDERSCORE, replaceText)

    if (text.includes(UNDERSCORE)) {
        return removeUnderscore(text)
    }

    return text
}