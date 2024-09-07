import { BrowserWindow } from "electron"
import { join } from "node:path"

export default function (): BrowserWindow {
    let window = new BrowserWindow({
        frame: false,
        center: true,
        movable: false,
        resizable: false,
        width: 600,
        height: 400,
        roundedCorners: true,
        icon: join(__dirname, "../../assets/img/icon.png")
    })

    window.loadFile(join(__dirname, "../../views", "splash-screen.html"))

    return window
}