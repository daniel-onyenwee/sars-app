import { validate } from "uuid"

export function match(param: string) {
    return validate(param)
}