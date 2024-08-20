export function getCurrentSession() {
    let currentDate = new Date()

    if (currentDate.getMonth() >= 9) {
        return `${currentDate.getFullYear()}/${currentDate.getFullYear() + 1}`
    } else {
        return `${currentDate.getFullYear() - 1}/${currentDate.getFullYear()}`
    }
}
