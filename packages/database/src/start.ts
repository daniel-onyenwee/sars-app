import Database, { Postgres } from "./index.js"

async function main() {
    await Postgres.stopAll()

    await Database({ port: 9089 })
}

main()