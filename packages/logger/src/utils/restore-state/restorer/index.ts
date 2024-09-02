import { default as Faculty } from "./faculty.js"
import { default as Department } from "./department.js"
import { default as Course } from "./course.js"
import { default as Student } from "./student.js"
import { default as Lecturer } from "./lecturer.js"
import { default as AttendanceRegister } from "./attendanceRegister.js"
import { default as AttendanceRegisterLecturer } from "./attendanceRegisterLecturer.js"
import { default as AttendanceRegisterStudent } from "./attendanceRegisterStudent.js"
import { default as ClassAttendance } from "./classAttendance.js"
import { default as ClassAttendee } from "./classAttendee.js"
import { default as CourseClashAttendance } from "./courseClashAttendance.js"

const Restorers = {
	Faculty,
	Department,
	Course,
	Student,
	Lecturer,
	AttendanceRegister,
	AttendanceRegisterLecturer,
	AttendanceRegisterStudent,
	ClassAttendance,
	ClassAttendee,
	CourseClashAttendance,
}

export default Restorers