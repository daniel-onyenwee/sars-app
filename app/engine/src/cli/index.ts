import { Command } from "@commander-js/extra-typings"
import { configCommand, logCommand, startCommand } from "./command/index.js"

const program = new Command("sars-engine")
    .description("CLI to manage the engine running background tasks for the SARs desktop app.")
    .addCommand(startCommand, { isDefault: true })
    .addCommand(configCommand)
    .addCommand(logCommand)
    .version("1.0.0", "-v, --version")

await program.parseAsync()