import { differenceInMinutes, minutesToHours, minutesToSeconds, minutesToMilliseconds } from "date-fns"

export function differenceInTimePeriods(format: "minute" | "hour" | "second" | "millisecond" = "minute", periods: { startTime: Date, endTime: Date }[] = []) {
    let totalMinute = 0

    periods.forEach((period) => {
        totalMinute += differenceInMinutes(period.endTime, period.startTime)
    })

    if (format == "hour") {
        return minutesToHours(totalMinute)
    } else if (format == "second") {
        return minutesToSeconds(totalMinute)
    } else if (format == "millisecond") {
        return minutesToMilliseconds(totalMinute)
    } else {
        return totalMinute
    }
} 