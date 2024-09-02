export function generatePassword(length: number) {
    const letters = "abdcefghijklmnopqrstwuvxyz"
    const supportedCharacters = letters + letters.toUpperCase() + "1234567890"

    let password = String()
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * supportedCharacters.length)
        password += supportedCharacters[randomIndex]
    }

    return password
}