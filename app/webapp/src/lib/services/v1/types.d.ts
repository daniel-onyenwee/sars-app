import type {
    Level,
    Semester,
    Gender,
    ClassAttendanceStatus
} from "../types"

interface BaseModel {
    id: string
    updatedAt: Date
    createdAt: Date
}

export interface AdminUserModel extends BaseModel {
    id: string
    refreshToken: string
    password: string
    username: string
}

export interface FacultyModel extends BaseModel {
    name: string
}

export interface DepartmentModel extends BaseModel {
    name: string
    faculty: string
    levels: Level[]
}

interface RecordModel extends BaseModel {
    faculty: string
    department: string
}

export interface CourseModel extends RecordModel {
    semester: Semester
    level: Level
    code: string
    title: string
}

export interface LecturerModel extends RecordModel {
    name: string
    gender: Gender
    surname: string,
    otherNames: string,
    username: string
}

export interface StudentModel extends Omit<LecturerModel, "username"> {
    regno: string
    level: Level
}

export interface AttendanceRegisterModel extends RecordModel {
    session: string;
    level: Level;
    decision: any
    semester: Semester;
    courseTitle: string;
    courseCode: string;
}

export type AttendanceRegisterStudentModel = StudentModel

export type AttendanceRegisterLecturerModel = LecturerModel

export interface ClassAttendanceModel extends Omit<AttendanceRegisterModel, "decision"> {
    lecturerName: string
    lecturerUsername: string
    date: Date
    startTime: Date
    endTime: Date
}

export interface ClassAttendeeModel {
    id: string
    regno: string
    status: string
    surname: string
    otherNames: string
    name: string
    courseClashCode: string
    courseClashTitle: string
}

export type AttendanceRegisterAttendanceModel = Omit<ClassAttendeeModel, "status" | "courseClash"> & {
    classesAttended: number
    classesAttendedPercentage: number
    numberOfClassTaught: number
    decision: "ADMIT" | "REJECT"
} & Record<string, "PRESENT" | "ABSENT">

export interface LecturerReportDetail {
    id: string
    courseCode: string
    courseTitle: string
    totalClasses: number
    semester: Semester
    totalClassesInHour: number
    classesTaught: number
    classesTaughtInHour: number
    classesTaughtPercentage: number
}

export interface StudentReportDetail {
    id: string
    courseCode: string
    courseTitle: string
    semester: Semester
    totalClasses: number
    classesAttended: number
    classesAttendedPercentage: number
}

export interface StudentReportMetadata {
    name: string
    regno: string
    surname: string
    otherNames: string
    gender: Gender
    level: Level
    department: string
    faculty: string
}
export interface StudentReportModel {
    metadata: StudentReportMetadata
    report: StudentReportDetail[]
}

export interface LecturerReportMetadata {
    name: string
    surname: string
    otherNames: string
    gender: Gender
    department: string
    faculty: string
}

export interface LecturerReportModel {
    metadata: LecturerReportMetadata
    report: LecturerReportDetail[]
}

export interface CourseReportMetadata {
    totalClasses: number
    classesDate: {
        id: string
        date: Date
        startTime: Date
        endTime: Date
    }[]
    totalClassesInHour: number
    code: string
    title: string
    level: Level
    semester: Semester
    department: string
    faculty: string
}

export type CourseReportDetail = ({
    classesAttended: number
    classesAttendedPercentage: number
    decision: "ADMIT" | "REJECT"
    id: string
    name: string
    regno: string
    surname: string
    otherNames: string
    numberOfClassTaught: number
} & Record<string, 0 | 1>)

export interface CourseReportModel {
    metadata: CourseReportMetadata
    report: CourseReportDetail[]
}

export interface AuthModel {
    expireIn: number
    accessToken: string
    refreshToken: string
}

export type * from "../types.js"