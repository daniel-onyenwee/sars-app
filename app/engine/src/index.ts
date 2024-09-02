import { spawn } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

type EngineCommands = "start" | "config" | "log"

type EngineArguments<Command extends Omit<EngineCommands, "start">> = Command extends "config" ? { key?: string, value?: string } : {}

type ConfigEngineOptions = {
    password: string,
    reset?: true,
    appDataDir: string
}

type LogEngineOptions = {
    dataUrl: string;
    loggerId: string;
    entries?: true;
    output?: string;
    apply?: string;
}

type EngineOptions<Command extends EngineCommands> = Command extends "config" ? ConfigEngineOptions : Command extends "log" ? LogEngineOptions : { appDataDir: string }

type EngineParameter<Command extends EngineCommands> = (Command extends "start" ? {
    command: "start"
    options: EngineOptions<"start">
    argument: {}
} : Command extends "log" ? {
    command: "log"
    options: EngineOptions<"log">
    argument: {}
} : {
    command: "config"
    options: EngineOptions<"config">
    argument: EngineArguments<"config">
}) & {
    onMessage: (message: string) => void
    onError: (error: Error) => void
}

const Engine = function <Command extends EngineCommands>({ command, options, argument, onError, onMessage }: EngineParameter<Command>) {
    const engineExePath = join(__dirname, "../bin/engine.exe")

    let engineArgs: string[] = [command]

    if (command == "log") {
        engineArgs.push("-d", options.dataUrl, "-i", options.loggerId)

        if (options.output) {
            engineArgs.push("-o", options.output)
        } else if (options.apply) {
            engineArgs.push("-a", options.apply)
        }
    } else {
        engineArgs.push("-a", options.appDataDir)
    }

    if (command == "config") {
        engineArgs.push("-p", options.password)

        if (options.reset) {
            engineArgs.push("-r")
        }

        if (argument.key) {
            engineArgs.push(argument.key)
            argument.value ? engineArgs.push(argument.value) : void 0
        }
    }

    let shellProcess = spawn(engineExePath, engineArgs)

    shellProcess.stdout.on('data', (chunk) => {
        let message = chunk.toString("utf-8")
        if (message.startsWith("error")) {
            onError(new Error(message.replace("error: ", String())))
        } else {
            onMessage(message)
        }
    })

    shellProcess.stderr.on('data', (error) => {
        let errorMessage = error.toString("utf-8")
        onError(new Error(errorMessage.replace("error: ", String())))
    })

    return {
        command,
        options,
        argument,
        killed: shellProcess.killed,
        kill() {
            shellProcess.kill()
        }
    }
}

export default Engine