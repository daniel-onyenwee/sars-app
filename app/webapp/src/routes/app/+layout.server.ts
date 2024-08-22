import { capitalizeText } from "@/utils"
import type { LayoutServerLoad } from "./$types"
import { validate as validateUUID } from "uuid"

export const load = (async ({ locals, url }) => {
    let currentPage = url.pathname

    return {
        pageTitle: getPageTitle(currentPage),
        breadCrumbItems: getBreadCrumbItems(currentPage),
        isMenuCollapsed: setCollapseMenuSetting(currentPage),
        currentPage,
        session: locals.session
    }
}) satisfies LayoutServerLoad

function setCollapseMenuSetting(currentPage: string) {
    let isMenuCollapsed = {
        attendances: false,
        reports: false,
        records: false,
    }

    if (currentPage.startsWith("/app/record")) {
        isMenuCollapsed.records = true;
        isMenuCollapsed.attendances = false;
        isMenuCollapsed.reports = false;
    } else if (currentPage.startsWith("/app/attendance")) {
        isMenuCollapsed.attendances = true;
        isMenuCollapsed.records = false;
        isMenuCollapsed.reports = false;
    } else if (currentPage.startsWith("/app/report")) {
        isMenuCollapsed.reports = true;
        isMenuCollapsed.records = false;
        isMenuCollapsed.attendances = false;
    } else {
        isMenuCollapsed.records = false;
        isMenuCollapsed.attendances = false;
        isMenuCollapsed.reports = false;
    }

    return isMenuCollapsed
}

const getBreadCrumbItems = (currentPage: string) => {
    if (currentPage == "/app") {
        return [
            { href: "/app", label: "Dashboard" }
        ]
    }

    let items: { href: string, label: string }[] = []

    let paths = currentPage.split("/")

    let jointPaths = ""

    let previousPath = ""

    for (const path of paths) {
        if (!path) continue

        if (!validateUUID(path) && !/^(\d{4})\/(\d{4})$/.test(decodeURIComponent(path))) {
            jointPaths = `${jointPaths}/${path}`
        }

        if (["record", "attendance", "report"].includes(path)) {
            items.push({ href: "#", label: path })
        } else if (["department", "course", "student", "lecturer", "register"].includes(path)) {
            items.push({ href: jointPaths, label: path + "s" })
        } else if (path == "faculty") {
            items.push({ href: jointPaths, label: "faculties" })
        } else if (path == "class-attendance") {
            items.push({ href: jointPaths, label: "Class attendances" })
        } else if (path == "class-attendee") {
            items.push({ href: jointPaths, label: "Class attendees" })
        } else if (validateUUID(path)) {
            items.push({ href: jointPaths, label: path })
        } else {
            items.push({ href: `${jointPaths}/${previousPath}/${path}`, label: decodeURIComponent(path) })
        }

        previousPath = path
    }

    return items
}

const getPageTitle = (currentPage: string) => {
    if (currentPage == "/app") {
        return "Dashboard | SARs"
    }

    let [thirdLastItem, secondLastItem, lastItem] = currentPage.split("/").slice(-3)

    if (!lastItem) {
        return capitalizeText(secondLastItem, true)
    } else {
        if (lastItem == "faculty") {
            lastItem = "faculties"
        } else {
            lastItem = lastItem + "s"
        }

        if (validateUUID(secondLastItem)) {
            secondLastItem = thirdLastItem || secondLastItem
        }

        lastItem = lastItem.replace("-", " ")
        secondLastItem = secondLastItem.replace("-", " ")

        return ` ${capitalizeText(lastItem, true)} | ${capitalizeText(secondLastItem, true)}`
    }
}