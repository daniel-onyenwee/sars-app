<script lang="ts">
  import { LoaderCircle, ChevronsUpDown, Check } from "lucide-svelte/icons";
  import { showToast } from "@/utils";
  import * as Sheet from "@/components/ui/sheet";
  import * as Command from "@/components/ui/command";
  import * as Popover from "@/components/ui/popover";
  import {
    getStudents,
    getCourses,
    addClassAttendees,
    type ClassAttendeeModel,
    type StudentModel,
    type CourseModel,
  } from "@/services";
  import { cn } from "@/utils.js";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher, tick } from "svelte";
  import { Label } from "@/components/ui/label";

  export let accessToken: string;
  export let classAttendanceId: string;

  function show(mode: "ADD", data: undefined): void;
  function show(mode: "VIEW", data: ClassAttendeeModel): void;
  export function show(mode: "ADD" | "VIEW", data: any) {
    dialogMode = mode;
    if (mode == "VIEW") {
      classAttendeeData = structuredClone(data);
    }
    open = true;

    getStudents({ accessToken, count: "all" })
      .then(({ data }) => {
        students = data || [];
      })
      .then((_) => {
        return getCourses({
          accessToken,
          count: "all",
        });
      })
      .then(({ data }) => {
        courses = data || [];
      })
      .catch(() => {
        students = students || [];
        courses = courses || [];
      })
      .finally(() => {
        studentsLoaded = true;
        coursesLoaded = true;
      });
  }

  export function close() {
    internalClose();
    open = false;
  }

  function internalClose() {
    classAttendeeData = {};
    students = [];
    courses = [];
    studentsLoaded = false;
    coursesLoaded = false;
  }

  function onCrashCourseSelected(courseTitle: string, courseCode: string) {
    classAttendeeData.courseClashTitle = courseTitle;
    classAttendeeData.courseClashCode = courseCode;
    coursePopoverOpen = false;
  }

  function onStudentSelected(studentName: string, studentRegno: string) {
    classAttendeeData.name = studentName;
    classAttendeeData.regno = studentRegno;
    studentPopoverOpen = false;
  }

  function closeAndFocusTrigger(triggerId: string) {
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }

  async function onAdd() {
    requestOngoing = true;

    errorMessage = {};

    if (!classAttendeeData.regno) {
      errorMessage.regno = "Field required";
      return;
    }

    try {
      let { studentId, courseClashId } = classAttendeeData;

      if (!studentId) {
        throw new Error();
      }

      let serviceRequest = await addClassAttendees({
        accessToken: accessToken,
        classAttendanceId: classAttendanceId,
        classAttendees: [
          {
            studentId,
            courseClashId: courseClashId,
          },
        ],
      });

      if (serviceRequest.error) {
        requestOngoing = false;

        close();

        if (
          serviceRequest.error.code >= 1001 &&
          serviceRequest.error.code < 1004
        ) {
          dispatch("sessionError");
        } else {
          showToast("ERROR", "Request failed", serviceRequest.error.message);
        }
        return;
      }

      showToast(
        "SUCCESS",
        "Request successful",
        `Class attendee successfully added`
      );
      dispatch("successful");
    } catch {
      showToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  let classAttendeeData: Partial<
    ClassAttendeeModel & { studentId: string; courseClashId: string }
  > = {};
  let open = false;
  let requestOngoing: boolean = false;
  let errorMessage: Partial<Record<keyof ClassAttendeeModel, string>> = {};
  let studentPopoverOpen = false;
  let studentsLoaded = false;
  let students: StudentModel[] = [];
  let coursePopoverOpen = false;
  let coursesLoaded = false;
  let courses: CourseModel[] = [];
  let dialogMode: "ADD" | "VIEW" = "ADD";
  let dispatch = createEventDispatcher();

  $: dialogTitle =
    dialogMode == "VIEW" ? "Class attendee details" : `Add class attendee`;
  $: dialogDescription =
    dialogMode == "VIEW"
      ? "Complete information about the class attendee."
      : "Add a class attendee to the class attendance here. Click add when you're done.";
</script>

<Sheet.Root
  bind:open
  onOpenChange={(open) => {
    if (!open) {
      internalClose();
    }
  }}
>
  <Sheet.Content side="right" class="overflow-auto">
    <Sheet.Header>
      <Sheet.Title>{dialogTitle}</Sheet.Title>
      <Sheet.Description>{dialogDescription}</Sheet.Description>
    </Sheet.Header>
    {#if dialogMode == "VIEW"}
      <div class="grid items-start gap-4 mt-4">
        <div class="grid gap-2">
          <Label>Surname</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {classAttendeeData.surname}
          </span>
        </div>
        <div class="grid gap-2">
          <Label>Other names</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {classAttendeeData.otherNames}
          </span>
        </div>
        <div class="grid gap-2">
          <Label>Regno</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {classAttendeeData.regno}
          </span>
        </div>
        <div class="grid gap-2">
          <Label>Course clash</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {#if classAttendeeData.courseClashCode}
              {classAttendeeData.courseClashCode} - {classAttendeeData.courseClashTitle}
            {:else}
              -------------
            {/if}
          </span>
        </div>
      </div>
    {:else}
      <form class="grid items-start gap-4 mt-4">
        <div class="grid gap-2">
          <Label>Student</Label>
          <Popover.Root bind:open={studentPopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={studentPopoverOpen}
                class="w-full h-fit justify-between font-normal {classAttendeeData.regno ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if classAttendeeData.regno}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {classAttendeeData.name}
                    </p>
                    <p class="text-sm text-muted-foreground truncate text-left">
                      {classAttendeeData.regno}
                    </p>
                  </div>
                {:else}
                  Select student
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0" style="width: calc(100% - 3rem)">
              <Command.Root loop>
                <Command.Input placeholder="Search student..." />
                <Command.List>
                  {#if studentsLoaded}
                    <Command.Empty>No student found.</Command.Empty>
                    <Command.Group class="overflow-auto max-h-52">
                      {#each students as student}
                        <Command.Item
                          onSelect={() => {
                            classAttendeeData.studentId = student.id;
                            onStudentSelected(student.name, student.regno);
                            closeAndFocusTrigger(ids.trigger);
                          }}
                          value={`${student.regno} ${student.name}`}
                        >
                          <Check
                            class={cn(
                              "mr-2 h-4 w-4",
                              student.regno !== classAttendeeData.regno &&
                                "text-transparent"
                            )}
                          />
                          <div
                            style="width: calc(100% - 20px)"
                            class="grid gap-1"
                          >
                            <span>{student.name}</span>
                            <span class="text-sm text-muted-foreground">
                              {student.regno}
                            </span>
                          </div>
                        </Command.Item>
                      {/each}
                    </Command.Group>
                  {:else}
                    <Command.Loading class="py-6 text-center text-sm">
                      Loading students...
                    </Command.Loading>
                  {/if}
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.regno &&
              'hidden'}"
          >
            {errorMessage.regno}
          </p>
        </div>
        <div class="grid gap-2">
          <Label>Course clash</Label>
          <Popover.Root bind:open={coursePopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={coursePopoverOpen}
                class="w-full h-fit justify-between font-normal {classAttendeeData.courseClashCode ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if classAttendeeData.courseClashCode}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {classAttendeeData.courseClashTitle}
                    </p>
                    <p class="text-sm text-muted-foreground truncate text-left">
                      {classAttendeeData.courseClashCode}
                    </p>
                  </div>
                {:else}
                  Select course
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0" style="width: calc(100% - 3rem)">
              <Command.Root loop>
                <Command.Input placeholder="Search student..." />
                <Command.List>
                  {#if coursesLoaded}
                    <Command.Empty>No course found.</Command.Empty>
                    <Command.Group class="overflow-auto max-h-52">
                      {#each courses as course}
                        <Command.Item
                          onSelect={() => {
                            classAttendeeData.courseClashId = course.id;
                            onCrashCourseSelected(course.title, course.code);
                            closeAndFocusTrigger(ids.trigger);
                          }}
                          value={`${course.code} ${course.title}`}
                        >
                          <Check
                            class={cn(
                              "mr-2 h-4 w-4",
                              course.code !==
                                classAttendeeData.courseClashCode &&
                                "text-transparent"
                            )}
                          />
                          <div
                            style="width: calc(100% - 20px)"
                            class="grid gap-1"
                          >
                            <span>{course.title}</span>
                            <span class="text-sm text-muted-foreground">
                              {course.code}
                            </span>
                          </div>
                        </Command.Item>
                      {/each}
                    </Command.Group>
                  {:else}
                    <Command.Loading class="py-6 text-center text-sm">
                      Loading courses...
                    </Command.Loading>
                  {/if}
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.courseClashCode &&
              'hidden'}"
          >
            {errorMessage.courseClashCode}
          </p>
        </div>
        <Button type="submit" on:click={onAdd} disabled={requestOngoing}>
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing ? "Add" : "Please wait"}
        </Button>
      </form>
    {/if}
  </Sheet.Content>
</Sheet.Root>
