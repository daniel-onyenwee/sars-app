import type { Models, Tables } from "./types.js"

export const tableModelName = (table: Tables): Models | null => {
    if (table == "faculties") {
        return "Faculty"
    } else if (table == "departments") {
        return "Department"
    } else if (table == "courses") {
        return "Course"
    } else if (table == "lecturers") {
        return "Lecturer"
    } else if (table == "students") {
        return "Student"
    } else if (table == "attendance_registers") {
        return "AttendanceRegister"
    } else if (table == "attendance_register_lecturers") {
        return "AttendanceRegisterLecturer"
    } else if (table == "attendance_register_students") {
        return "AttendanceRegisterStudent"
    } else if (table == "class_attendances") {
        return "ClassAttendance"
    } else if (table == "class_attendees") {
        return "ClassAttendee"
    } else if (table == "course_clash_attendances") {
        return "CourseClashAttendance"
    }

    return null
}