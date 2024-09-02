import { isAbsolute, join } from "node:path"
import { existsSync, access, constants as FsConstants, mkdirSync } from "node:fs"
import { InvalidOptionArgumentError } from "@commander-js/extra-typings"

async function isPathAccessible(path: string) {
    return new Promise<boolean>((resolve) => {
        access(path, FsConstants.R_OK | FsConstants.W_OK | FsConstants.X_OK, (err) => {
            err ? resolve(false) : resolve(true)
        })
    })
}

export async function appDataDirParse(dirPath: string, checkAccessibility: boolean = true) {
    if (!isAbsolute(dirPath)) {
        throw new InvalidOptionArgumentError("expected absolute path to App data directory")
    }

    if (!existsSync(dirPath)) {
        throw new InvalidOptionArgumentError("app data directory not found")
    }

    if (!checkAccessibility) {
        return dirPath
    }

    if (!(await isPathAccessible(dirPath))) {
        throw new InvalidOptionArgumentError("app data directory not accessible to File system operation")
    }

    if (existsSync(join(dirPath, "engine/db")) && !(await isPathAccessible(join(dirPath, "engine/db")))) {
        throw new InvalidOptionArgumentError("database directory not accessible to File system operation")
    }

    return dirPath
}