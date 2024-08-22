export function capitalizeText(text: string, firstWordOnly: boolean = false): string {
    return text.split(' ').map((word, index) => {
        if (firstWordOnly && index == 0) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        } else if (firstWordOnly) {
            return word
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}