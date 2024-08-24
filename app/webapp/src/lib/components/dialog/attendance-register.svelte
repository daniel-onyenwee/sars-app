<script lang="ts">
  import { LoaderCircle, ChevronsUpDown, Check } from "lucide-svelte/icons";
  import { showToast } from "@/utils";
  import * as Sheet from "@/components/ui/sheet";
  import * as Command from "@/components/ui/command";
  import * as Popover from "@/components/ui/popover";
  import {
    createAttendanceRegister,
    updateAttendanceRegister,
    getCourses,
    type AttendanceRegisterModel,
    type CourseModel,
  } from "@/services";
  import { cn } from "@/utils.js";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher, tick } from "svelte";
  import { Label } from "@/components/ui/label";

  export let accessToken: string;

  function show(mode: "CREATE", data: undefined): void;
  function show(mode: "UPDATE" | "VIEW", data: AttendanceRegisterModel): void;
  export function show(mode: "CREATE" | "UPDATE" | "VIEW", data: any) {
    dialogMode = mode;
    if (mode == "UPDATE" || mode == "VIEW") {
      attendanceRegisterData = structuredClone(data);
    }
    open = true;

    getCourses({ accessToken, count: "all" })
      .then(({ data }) => {
        courses = data || [];
      })
      .catch(() => {
        courses = [];
      })
      .finally(() => {
        coursesLoaded = true;
      });
  }

  function internalClose() {
    errorMessage = {};
    attendanceRegisterData = {};
    coursesLoaded = false;
    courses = [];
    coursesLoaded = false;
  }

  export function close() {
    internalClose();
    open = false;
  }

  function onSessionSelected(currentValue: string) {
    attendanceRegisterData.session = currentValue as any;
    sessionPopoverOpen = false;
  }

  function onCourseSelected(courseCode: string, courseTitle: string) {
    attendanceRegisterData.courseTitle = courseTitle;
    attendanceRegisterData.courseCode = courseCode;
    coursePopoverOpen = false;
  }

  function closeAndFocusTrigger(triggerId: string) {
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }

  async function onCreateOrUpdate() {
    requestOngoing = true;

    errorMessage = {};

    let formInputs = ["courseCode", "session"];

    for (const key of formInputs) {
      if (!Object(attendanceRegisterData)[key]) {
        Object(errorMessage)[key] = "Field required";
        requestOngoing = false;
        return;
      }
    }

    try {
      let serviceRequest = null;
      let { courseId, session } = attendanceRegisterData as Required<
        AttendanceRegisterModel & { courseId: string }
      >;

      if (dialogMode == "CREATE") {
        serviceRequest = await createAttendanceRegister({
          accessToken: accessToken,
          courseId,
          session,
        });
      } else {
        serviceRequest = await updateAttendanceRegister({
          id: attendanceRegisterData.id as string,
          accessToken: accessToken,
          courseId,
          session,
        });
      }

      if (!serviceRequest) {
        throw new Error();
      }

      if (serviceRequest.error) {
        requestOngoing = false;

        if (
          serviceRequest.error.code >= 1001 &&
          serviceRequest.error.code < 1004
        ) {
          close();
          dispatch("sessionError");
        } else if (serviceRequest.error.code == 3015) {
          errorMessage.courseCode = serviceRequest.error.message;
        } else if (serviceRequest.error.code == 4005) {
          errorMessage.session = serviceRequest.error.message;
        } else {
          close();
          showToast(
            "ERROR",
            "Request failed",
            serviceRequest.error.code == 4015
              ? "Register not found"
              : serviceRequest.error.message
          );
        }
        return;
      }

      showToast(
        "SUCCESS",
        "Request successful",
        `Register successfully ${dialogMode == "CREATE" ? "created" : "edited"}`
      );
      dispatch("successful");
    } catch {
      showToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  let requestOngoing: boolean = false;
  let errorMessage: Partial<Record<keyof AttendanceRegisterModel, string>> = {};
  let attendanceRegisterData: Partial<
    AttendanceRegisterModel & { courseId: string }
  > = {};
  let open = false;
  let sessionPopoverOpen = false;
  let coursePopoverOpen = false;
  let coursesLoaded = false;
  let courses: CourseModel[] = [];
  let dialogMode: "CREATE" | "UPDATE" | "VIEW" = "CREATE";
  let dispatch = createEventDispatcher();

  $: dialogTitle =
    dialogMode == "VIEW"
      ? "Register details"
      : `${dialogMode == "CREATE" ? "Create" : "Edit"} register`;
  $: dialogDescription =
    dialogMode == "VIEW"
      ? "Complete information about the register."
      : `${
          dialogMode == "CREATE"
            ? "Create a new register here. Click create when you're done."
            : "Make changes to the register here. Click save when you're done."
        }`;
</script>

<Sheet.Root
  closeOnEscape={!requestOngoing}
  closeOnOutsideClick={!requestOngoing}
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
    <form class="grid items-start gap-4 mt-4">
      {#if dialogMode == "VIEW"}
        <div class="grid gap-2">
          <Label for="course-title">Course title</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="course-title"
          >
            {attendanceRegisterData.courseTitle}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="course-code">Course code</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="course-code"
          >
            {attendanceRegisterData.courseCode}
          </span>
        </div>
      {:else}
        <div class="grid gap-2">
          <Label>Course</Label>
          <Popover.Root bind:open={coursePopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={coursePopoverOpen}
                class="w-full h-fit justify-between font-normal {attendanceRegisterData.courseCode ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if attendanceRegisterData.courseCode}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {attendanceRegisterData.courseTitle}
                    </p>
                    <p class="text-sm text-muted-foreground truncate text-left">
                      {attendanceRegisterData.courseCode}
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
                <Command.Input placeholder="Search course..." />
                <Command.List>
                  {#if coursesLoaded}
                    <Command.Empty>No course found.</Command.Empty>
                    <Command.Group class="overflow-auto max-h-52">
                      {#each courses as course}
                        <Command.Item
                          onSelect={() => {
                            attendanceRegisterData.courseId = course.id;
                            onCourseSelected(course.code, course.title);
                            closeAndFocusTrigger(ids.trigger);
                          }}
                          value={`${course.code} ${course.title}`}
                        >
                          <Check
                            class={cn(
                              "mr-2 h-4 w-4",
                              course.code !==
                                attendanceRegisterData.courseCode &&
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
            class="text-sm font-medium text-red-500 {!errorMessage.courseCode &&
              'hidden'}"
          >
            {errorMessage.courseCode}
          </p>
        </div>
      {/if}
      <div class="grid gap-2">
        <Label>Session</Label>
        {#if dialogMode == "VIEW"}
          <span
            class="flex capitalize h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {attendanceRegisterData.session}
          </span>
        {:else}
          <Popover.Root bind:open={sessionPopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={sessionPopoverOpen}
                class="w-full justify-between font-normal {attendanceRegisterData.session ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if attendanceRegisterData.session}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {attendanceRegisterData.session}
                    </p>
                  </div>
                {:else}
                  Select session
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0" style="width: calc(100% - 3rem)">
              <Command.Root loop>
                <Command.Input placeholder="Search session..." />
                <Command.List>
                  <Command.Empty>No session found.</Command.Empty>
                  <Command.Group class="overflow-auto max-h-52">
                    {#each { length: 5 } as _, i}
                      <Command.Item
                        onSelect={(currentValue) => {
                          onSessionSelected(currentValue);
                          closeAndFocusTrigger(ids.trigger);
                        }}
                        value={`${new Date().getFullYear() - 5 + i}/${new Date().getFullYear() - 4 + i}`}
                      >
                        <Check
                          class={cn(
                            "mr-2 h-4 w-4",
                            attendanceRegisterData.session !==
                              `${new Date().getFullYear() - 5 + i}/${new Date().getFullYear() - 4 + i}` &&
                              "text-transparent"
                          )}
                        />
                        {`${new Date().getFullYear() - 5 + i}/${new Date().getFullYear() - 4 + i}`}
                      </Command.Item>
                    {/each}
                    {#each { length: 5 } as _, i}
                      <Command.Item
                        onSelect={(currentValue) => {
                          onSessionSelected(currentValue);
                          closeAndFocusTrigger(ids.trigger);
                        }}
                        value={`${new Date().getFullYear() + i}/${new Date().getFullYear() + (i + 1)}`}
                      >
                        <Check
                          class={cn(
                            "mr-2 h-4 w-4",
                            attendanceRegisterData.session !==
                              `${new Date().getFullYear() + i}/${new Date().getFullYear() + (i + 1)}` &&
                              "text-transparent"
                          )}
                        />
                        {`${new Date().getFullYear() + i}/${new Date().getFullYear() + (i + 1)}`}
                      </Command.Item>
                    {/each}
                  </Command.Group>
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.session &&
              'hidden'}"
          >
            {errorMessage.session}
          </p>
        {/if}
      </div>
      {#if dialogMode == "VIEW"}
        <div class="grid gap-2">
          <Label for="department">Department</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="department"
          >
            {attendanceRegisterData.department}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="faculty">Faculty</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="faculty"
          >
            {attendanceRegisterData.faculty}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="semester">Semester</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="semester"
          >
            {attendanceRegisterData.semester}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="level">Level</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="level"
          >
            {(attendanceRegisterData.level || "L_100").replace("L_", String())}L
          </span>
        </div>
      {/if}
      <Button
        type="submit"
        on:click={onCreateOrUpdate}
        disabled={requestOngoing}
        class={dialogMode == "VIEW" ? "hidden" : "visible"}
      >
        <LoaderCircle
          class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
        />
        {!requestOngoing
          ? dialogMode == "CREATE"
            ? "Create"
            : "Save"
          : "Please wait"}
      </Button>
    </form>
  </Sheet.Content>
</Sheet.Root>
