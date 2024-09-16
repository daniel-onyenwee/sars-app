import { isAbsolute, join } from "node:path"
import { existsSync, mkdirSync } from "node:fs"
import { InvalidOptionArgumentError } from "@commander-js/extra-typings"

export async function appDataDirParse(dirPath: string) {
    if (!isAbsolute(dirPath)) {
        throw new InvalidOptionArgumentError("expected absolute path to App data directory")
    }

    if (!existsSync(dirPath)) {
        throw new InvalidOptionArgumentError("app data directory not found")
    }

    if (!existsSync(join(dirPath, "Engine"))) {
        mkdirSync(join(dirPath, "Engine"), { recursive: true })
    }

    return dirPath
}