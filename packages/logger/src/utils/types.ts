import * as Prisma from "@prisma/client"

export type Tables = "faculties" |
    "departments" |
    "courses" |
    "students" |
    "lecturers" |
    "attendance_registers" |
    "attendance_register_lecturers" |
    "attendance_register_students" |
    "class_attendances" |
    "class_attendees" |
    "course_clash_attendances"

export type Models = "Faculty" |
    "Department" |
    "Course" |
    "Student" |
    "Lecturer" |
    "AttendanceRegister" |
    "AttendanceRegisterLecturer" |
    "AttendanceRegisterStudent" |
    "ClassAttendance" |
    "ClassAttendee" |
    "CourseClashAttendance"

type ImageType<Model extends Models> = Model extends "Department" ? Prisma.Department
    : Model extends "Course" ? Prisma.Course
    : Model extends "Student" ? Prisma.Student
    : Model extends "Lecturer" ? Prisma.Lecturer
    : Model extends "AttendanceRegister" ? Prisma.AttendanceRegister
    : Model extends "AttendanceRegisterLecturer" ? Prisma.AttendanceRegisterLecturer
    : Model extends "AttendanceRegisterStudent" ? Prisma.AttendanceRegisterStudent
    : Model extends "ClassAttendance" ? Prisma.ClassAttendance
    : Model extends "ClassAttendee" ? Prisma.ClassAttendee
    : Model extends "CourseClashAttendance" ? Prisma.CourseClashAttendance
    : Prisma.Faculty

type BeforeImageType<Model extends Models, Action extends Prisma.$Enums.LogAction> = Action extends "INSERT" ? null : ImageType<Model>

type AfterImageType<Model extends Models, Action extends Prisma.$Enums.LogAction> = Action extends "DELETE" ? null : ImageType<Model>

export type Applier<Model extends Models, Action extends Prisma.$Enums.LogAction> = (data: { dbClient: Prisma.PrismaClient, model: Model, action: Action, beforeImage: BeforeImageType<Model, Action>, afterImage: AfterImageType<Model, Action> }) => Promise<void>

export type Restorer<Model extends Models, Action extends Prisma.$Enums.LogAction> = Applier<Model, Action>