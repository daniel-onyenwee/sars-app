export default `DO $$ DECLARE course_clash_attendances_record record;
attendance_register_student record;
BEGIN FOR course_clash_attendances_record IN 
SELECT 
  * 
FROM 
  (
    SELECT 
      C_A.ATTENDANCE_REGISTER_ID AS ATTENDANCE_REGISTER_ID, 
      C_C_A.ID AS COURSE_CLASH_ATTENDANCE_ID, 
      C_A.ID AS CLASS_ATTENDANCE_ID, 
      C_C_A.STUDENT_ID 
    FROM 
      PUBLIC.COURSE_CLASH_ATTENDANCES AS C_C_A 
      JOIN (
        SELECT 
          C_A_1.ID AS ID, 
          C_A_1.START_TIME, 
          C_A_1.END_TIME, 
          C_A_1.DATE, 
          A_R.SESSION AS SESSION, 
          A_R.ID AS ATTENDANCE_REGISTER_ID, 
          A_R.COURSE_ID AS COURSE_ID 
        FROM 
          PUBLIC.CLASS_ATTENDANCES AS C_A_1 
          JOIN PUBLIC.ATTENDANCE_REGISTERS AS A_R ON C_A_1.ATTENDANCE_REGISTER_ID = A_R.ID 
      ) AS C_A ON C_A.SESSION = C_C_A.SESSION 
      AND C_A.COURSE_ID = C_C_A.COURSE_ID 
      AND C_A.DATE = C_C_A.DATE 
      AND C_A.START_TIME = C_C_A.START_TIME 
      AND C_A.END_TIME = C_C_A.END_TIME
  ) AS _query LOOP INSERT INTO public.attendance_register_students(
    id, attendance_register_id, student_id, 
    updated_at
  ) 
VALUES 
  (
    gen_random_uuid():: TEXT, 
    course_clash_attendances_record.ATTENDANCE_REGISTER_ID, 
    course_clash_attendances_record.STUDENT_ID, 
    now()
  ) ON CONFLICT(
    attendance_register_id, student_id
  ) DO 
UPDATE 
SET 
  student_id = course_clash_attendances_record.STUDENT_ID RETURNING id INTO attendance_register_student;
INSERT INTO public.class_attendees(
  id, class_attendance_id, attendance_register_student_id, 
  updated_at, course_clash_attendance_depending_on_id
) 
VALUES 
  (
    gen_random_uuid():: TEXT, 
    course_clash_attendances_record.CLASS_ATTENDANCE_ID, 
    attendance_register_student.id, 
    now(),
    course_clash_attendances_record.COURSE_CLASH_ATTENDANCE_ID
  ) ON CONFLICT(
    class_attendance_id, attendance_register_student_id
  ) DO NOTHING;
END LOOP;
END $$
`