DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Semester') THEN
        CREATE TYPE "Semester" AS ENUM ('FIRST', 'SECOND');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Level') THEN
        CREATE TYPE "Level" AS ENUM ('L_100', 'L_200', 'L_300', 'L_400', 'L_500', 'L_600', 'L_800', 'L_700', 'L_900', 'L_1000');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Gender') THEN
        CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "faculties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "levels" "Level"[] DEFAULT ARRAY['L_100']::"Level"[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "level" "Level" NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lecturers" (
    "id" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "other_names" TEXT NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'MALE',
    "department_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "lecturers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "students" (
    "id" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "other_names" TEXT NOT NULL,
    "regno" TEXT NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'MALE',
    "level" "Level" NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "attendance_registers" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "decision" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "attendance_registers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "attendance_register_lecturers" (
    "id" TEXT NOT NULL,
    "attendance_register_id" TEXT NOT NULL,
    "lecturer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "attendance_register_lecturers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "attendance_register_students" (
    "id" TEXT NOT NULL,
    "attendance_register_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "attendance_register_students_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "class_attendances" (
    "id" TEXT NOT NULL,
    "attendance_register_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "attendance_register_lecturer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "class_attendances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "class_attendees" (
    "id" TEXT NOT NULL,
    "class_attendance_id" TEXT NOT NULL,
    "attendance_register_student_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "class_attendees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "course_clash_attendances" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_attendee_id" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "course_clash_attendances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "courses_code_key" ON "courses"("code");

CREATE UNIQUE INDEX IF NOT EXISTS "students_regno_key" ON "students"("regno");

CREATE UNIQUE INDEX IF NOT EXISTS "attendance_registers_course_id_session_key" ON "attendance_registers"("course_id", "session");

CREATE UNIQUE INDEX IF NOT EXISTS "attendance_register_lecturers_attendance_register_id_lectur_key" ON "attendance_register_lecturers"("attendance_register_id", "lecturer_id");

CREATE UNIQUE INDEX IF NOT EXISTS "attendance_register_students_attendance_register_id_student_key" ON "attendance_register_students"("attendance_register_id", "student_id");

CREATE UNIQUE INDEX IF NOT EXISTS "class_attendees_class_attendance_id_attendance_register_stu_key" ON "class_attendees"("class_attendance_id", "attendance_register_student_id");

CREATE UNIQUE INDEX IF NOT EXISTS "course_clash_attendances_class_attendee_id_key" ON "course_clash_attendances"("class_attendee_id");

-- Check and add constraint for departments.faculty_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'departments_faculty_id_fkey' 
        AND table_name = 'departments'
    ) THEN
        ALTER TABLE "departments" ADD CONSTRAINT "departments_faculty_id_fkey" 
        FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for courses.department_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'courses_department_id_fkey' 
        AND table_name = 'courses'
    ) THEN
        ALTER TABLE "courses" ADD CONSTRAINT "courses_department_id_fkey" 
        FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for lecturers.department_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lecturers_department_id_fkey' 
        AND table_name = 'lecturers'
    ) THEN
        ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_department_id_fkey" 
        FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for students.department_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'students_department_id_fkey' 
        AND table_name = 'students'
    ) THEN
        ALTER TABLE "students" ADD CONSTRAINT "students_department_id_fkey" 
        FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for attendance_registers.course_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendance_registers_course_id_fkey' 
        AND table_name = 'attendance_registers'
    ) THEN
        ALTER TABLE "attendance_registers" ADD CONSTRAINT "attendance_registers_course_id_fkey" 
        FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for attendance_register_lecturers.attendance_register_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendance_register_lecturers_attendance_register_id_fkey' 
        AND table_name = 'attendance_register_lecturers'
    ) THEN
        ALTER TABLE "attendance_register_lecturers" ADD CONSTRAINT "attendance_register_lecturers_attendance_register_id_fkey" 
        FOREIGN KEY ("attendance_register_id") REFERENCES "attendance_registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for attendance_register_lecturers.lecturer_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendance_register_lecturers_lecturer_id_fkey' 
        AND table_name = 'attendance_register_lecturers'
    ) THEN
        ALTER TABLE "attendance_register_lecturers" ADD CONSTRAINT "attendance_register_lecturers_lecturer_id_fkey" 
        FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for attendance_register_students.attendance_register_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendance_register_students_attendance_register_id_fkey' 
        AND table_name = 'attendance_register_students'
    ) THEN
        ALTER TABLE "attendance_register_students" ADD CONSTRAINT "attendance_register_students_attendance_register_id_fkey" 
        FOREIGN KEY ("attendance_register_id") REFERENCES "attendance_registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for attendance_register_students.student_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendance_register_students_student_id_fkey' 
        AND table_name = 'attendance_register_students'
    ) THEN
        ALTER TABLE "attendance_register_students" ADD CONSTRAINT "attendance_register_students_student_id_fkey" 
        FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for class_attendances.attendance_register_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'class_attendances_attendance_register_id_fkey' 
        AND table_name = 'class_attendances'
    ) THEN
        ALTER TABLE "class_attendances" ADD CONSTRAINT "class_attendances_attendance_register_id_fkey" 
        FOREIGN KEY ("attendance_register_id") REFERENCES "attendance_registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for class_attendances.attendance_register_lecturer_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'class_attendances_attendance_register_lecturer_id_fkey' 
        AND table_name = 'class_attendances'
    ) THEN
        ALTER TABLE "class_attendances" ADD CONSTRAINT "class_attendances_attendance_register_lecturer_id_fkey" 
        FOREIGN KEY ("attendance_register_lecturer_id") REFERENCES "attendance_register_lecturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for class_attendees.class_attendance_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'class_attendees_class_attendance_id_fkey' 
        AND table_name = 'class_attendees'
    ) THEN
        ALTER TABLE "class_attendees" ADD CONSTRAINT "class_attendees_class_attendance_id_fkey" 
        FOREIGN KEY ("class_attendance_id") REFERENCES "class_attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for class_attendees.attendance_register_student_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'class_attendees_attendance_register_student_id_fkey' 
        AND table_name = 'class_attendees'
    ) THEN
        ALTER TABLE "class_attendees" ADD CONSTRAINT "class_attendees_attendance_register_student_id_fkey" 
        FOREIGN KEY ("attendance_register_student_id") REFERENCES "attendance_register_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for course_clash_attendances.course_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'course_clash_attendances_course_id_fkey' 
        AND table_name = 'course_clash_attendances'
    ) THEN
        ALTER TABLE "course_clash_attendances" ADD CONSTRAINT "course_clash_attendances_course_id_fkey" 
        FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for course_clash_attendances.student_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'course_clash_attendances_student_id_fkey' 
        AND table_name = 'course_clash_attendances'
    ) THEN
        ALTER TABLE "course_clash_attendances" ADD CONSTRAINT "course_clash_attendances_student_id_fkey" 
        FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Check and add constraint for course_clash_attendances.class_attendee_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'course_clash_attendances_class_attendee_id_fkey' 
        AND table_name = 'course_clash_attendances'
    ) THEN
        ALTER TABLE "course_clash_attendances" ADD CONSTRAINT "course_clash_attendances_class_attendee_id_fkey" 
        FOREIGN KEY ("class_attendee_id") REFERENCES "class_attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;