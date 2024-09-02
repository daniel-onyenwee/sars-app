export const dbDefinitionQuery = (loggerId: string) => `DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LogMode') THEN
        CREATE TYPE "LogMode" AS ENUM ('SAVE', 'APPLY', 'UNDO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LogAction') THEN
        CREATE TYPE "LogAction" AS ENUM ('INSERT', 'UPDATE', 'DELETE');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "log_entries" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "action" "LogAction" NOT NULL,
    "table" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,
    "logger_id" TEXT NOT NULL,
    "before_image" JSONB,
    "after_image" JSONB,

    CONSTRAINT "log_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "log_states" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "mode" "LogMode" NOT NULL DEFAULT 'SAVE',
    "set_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logger_id" TEXT NOT NULL,

    CONSTRAINT "log_stats_pkey" PRIMARY KEY ("id")
);

-- Populate the log_states table if empty
INSERT INTO log_states(mode, logger_id, set_at) SELECT 'SAVE', '${loggerId}', '${new Date().toISOString()}' WHERE NOT EXISTS (SELECT 1 FROM log_states);

CREATE TABLE IF NOT EXISTS "log_contributors" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "logger_id" TEXT NOT NULL,
    "last_entry_at" TIMESTAMP(3) NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_contributors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "log_contributors_logger_id_key" ON "log_contributors"("logger_id");

CREATE OR REPLACE FUNCTION jsonb_to_camelcase(json_data JSONB) RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}'::JSONB;
    jsonb_key TEXT;
    jsonb_value JSONB;
    camel_key TEXT;
BEGIN
    FOR jsonb_key, jsonb_value IN
        SELECT key, value FROM jsonb_each(json_data)
    LOOP
        camel_key := lower(substring(jsonb_key, 1, 1)) || lower(substring(regexp_replace(initcap(substring(jsonb_key, 2)), '_', '', 'g'), 1, 1)) || substring(regexp_replace(initcap(substring(jsonb_key, 2)), '_', '', 'g'), 2);
        result := result || jsonb_build_object(camel_key, jsonb_value);
    END LOOP;

    RETURN result;
END
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION format_log_image(image JSONB) RETURNS JSONB AS $$
BEGIN
    IF image->'createdAt' IS NOT NULL THEN
        image := jsonb_set(image, '{createdAt}', to_jsonb(image->>'createdAt' || 'Z'));
	END IF;
    IF image->'updatedAt' IS NOT NULL THEN
        image := jsonb_set(image, '{updatedAt}', to_jsonb(image->>'updatedAt' || 'Z'));
	END IF;
    IF image->'date' IS NOT NULL THEN
        image := jsonb_set(image, '{date}', to_jsonb(image->>'date' || 'T00:00:00.000Z'));
	END IF;
    IF image->'startTime' IS NOT NULL THEN
        image := jsonb_set(image, '{startTime}', to_jsonb(CONCAT('1970-01-01T', image->>'startTime', '.000Z')));
	END IF;
    IF image->'endTime' IS NOT NULL THEN
        image := jsonb_set(image, '{endTime}', to_jsonb(CONCAT('1970-01-01T', image->>'endTime', '.000Z')));
	END IF;
    RETURN image;
END
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION save_database_changes() RETURNS TRIGGER AS $$
DECLARE
    log_state RECORD;
BEGIN
    SELECT mode, logger_id INTO log_state FROM public.log_states ORDER BY set_at DESC LIMIT 1;
    IF log_state IS NULL THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;

    IF log_state.mode = 'UNDO' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        INSERT INTO log_entries(logger_id, action, "table", before_image, after_image) VALUES(log_state.logger_id, TG_OP::"LogAction", TG_TABLE_NAME, format_log_image(jsonb_to_camelcase(to_jsonb(OLD))), to_jsonb(NEW));
        RETURN OLD;
    ELSEIF TG_OP = 'INSERT' THEN
        INSERT INTO log_entries(logger_id, action, "table", before_image, after_image) VALUES(log_state.logger_id, TG_OP::"LogAction", TG_TABLE_NAME, to_jsonb(OLD), format_log_image(jsonb_to_camelcase(to_jsonb(NEW))));
    ELSEIF TG_OP = 'UPDATE' THEN
        INSERT INTO log_entries(logger_id, action, "table", before_image, after_image) VALUES(log_state.logger_id, TG_OP::"LogAction", TG_TABLE_NAME, format_log_image(jsonb_to_camelcase(to_jsonb(OLD))), format_log_image(jsonb_to_camelcase(to_jsonb(NEW))));
    END IF;
    RETURN NEW;
END
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER attendance_register_lecturers_logger
    AFTER INSERT OR UPDATE OR DELETE ON public.attendance_register_lecturers
    FOR EACH ROW EXECUTE PROCEDURE public.save_database_changes();

CREATE OR REPLACE TRIGGER attendance_register_students_logger
    AFTER INSERT OR UPDATE OR DELETE ON public.attendance_register_students
    FOR EACH ROW EXECUTE PROCEDURE public.save_database_changes();

CREATE OR REPLACE TRIGGER attendance_registers_logger
    AFTER INSERT OR UPDATE OR DELETE ON public.attendance_registers
    FOR EACH ROW EXECUTE PROCEDURE public.save_database_changes();

CREATE OR REPLACE TRIGGER class_attendances_logger
    AFTER INSERT OR UPDATE OR DELETE ON public.class_attendances
    FOR EACH ROW EXECUTE PROCEDURE public.save_database_changes();

CREATE OR REPLACE TRIGGER class_attendees_logger
    AFTER INSERT OR UPDATE OR DELETE ON public.class_attendees
    FOR EACH ROW EXECUTE PROCEDURE public.save_database_changes();

CREATE OR REPLACE TRIGGER course_clash_attendances_logger
    AFTER INSERT OR UPDATE OR DELETE ON public.course_clash_attendances
    FOR EACH ROW EXECUTE PROCEDURE public.save_database_changes();

CREATE OR REPLACE TRIGGER courses_logger
    AFTER INSERT OR UPDATE OR DELETE ON public.courses
    FOR EACH ROW EXECUTE PROCEDURE public.save_database_changes();

CREATE OR REPLACE TRIGGER departments_logger
    AFTER INSERT OR UPDATE OR DELETE ON public.departments
    FOR EACH ROW EXECUTE PROCEDURE public.save_database_changes();

CREATE OR REPLACE TRIGGER faculties_logger
    AFTER INSERT OR UPDATE OR DELETE ON public.faculties
    FOR EACH ROW EXECUTE PROCEDURE public.save_database_changes();

CREATE OR REPLACE TRIGGER lecturers_logger
    AFTER INSERT OR UPDATE OR DELETE ON public.lecturers
    FOR EACH ROW EXECUTE PROCEDURE public.save_database_changes();

CREATE OR REPLACE TRIGGER students_logger
    AFTER INSERT OR UPDATE OR DELETE ON public.students
    FOR EACH ROW EXECUTE PROCEDURE public.save_database_changes();
`