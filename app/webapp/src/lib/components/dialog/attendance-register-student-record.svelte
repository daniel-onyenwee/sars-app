<script lang="ts">
  import { LoaderCircle, ChevronsUpDown, Check } from "lucide-svelte/icons";
  import { showToast } from "@/utils";
  import * as Sheet from "@/components/ui/sheet";
  import * as Command from "@/components/ui/command";
  import * as Popover from "@/components/ui/popover";
  import {
    getStudents,
    addAttendanceRegisterStudents,
    type AttendanceRegisterStudentModel,
    type StudentModel,
  } from "@/services";
  import { cn } from "@/utils.js";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher, tick } from "svelte";
  import { Label } from "@/components/ui/label";

  export let accessToken: string;
  export let attendanceRegisterId: string;
  export let excludedStudentsRegno: string[] = [];

  function show(mode: "ADD", data: undefined): void;
  function show(mode: "VIEW", data: AttendanceRegisterStudentModel): void;
  export function show(mode: "ADD" | "VIEW", data: any) {
    dialogMode = mode;
    if (mode == "VIEW") {
      attendanceRegisterStudentData = structuredClone(data);
    }
    open = true;

    getStudents({ accessToken, count: "all" })
      .then(({ data }) => {
        students = data || [];
      })
      .catch(() => {
        students = [];
      })
      .finally(() => {
        studentsLoaded = true;
      });
  }

  function internalClose() {
    errorMessage = {};
    attendanceRegisterStudentData = {};
    studentsLoaded = false;
    students = [];
    studentsLoaded = false;
  }

  export function close() {
    internalClose();
    open = false;
  }

  function onStudentSelected(studentName: string, studentRegno: string) {
    attendanceRegisterStudentData.name = studentName;
    attendanceRegisterStudentData.regno = studentRegno;
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

    let formInputs = ["regno"];

    for (const key of formInputs) {
      if (!Object(attendanceRegisterStudentData)[key]) {
        Object(errorMessage)[key] = "Field required";
        requestOngoing = false;
        return;
      }
    }

    try {
      let { studentId } = attendanceRegisterStudentData;

      if (!studentId) {
        throw new Error();
      }

      let serviceRequest = await addAttendanceRegisterStudents({
        accessToken: accessToken,
        registerId: attendanceRegisterId,
        studentsId: [studentId],
      });

      if (serviceRequest.error) {
        requestOngoing = false;

        if (
          serviceRequest.error.code >= 1001 &&
          serviceRequest.error.code < 1004
        ) {
          close();
          dispatch("sessionError");
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

      showToast("SUCCESS", "Request successful", `Student successfully added`);
      dispatch("successful");
    } catch {
      showToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  let requestOngoing: boolean = false;
  let errorMessage: Partial<
    Record<keyof AttendanceRegisterStudentModel, string>
  > = {};
  let attendanceRegisterStudentData: Partial<
    AttendanceRegisterStudentModel & { studentId: string }
  > = {};
  let open = false;
  let studentPopoverOpen = false;
  let studentsLoaded = false;
  let students: StudentModel[] = [];
  let dialogMode: "ADD" | "VIEW" = "ADD";
  let dispatch = createEventDispatcher();

  $: dialogTitle = dialogMode == "VIEW" ? "Student details" : `Add student`;
  $: dialogDescription =
    dialogMode == "VIEW"
      ? "Complete information about the student."
      : "Add a student to the register here. Click add when you're done.";
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
    {#if dialogMode == "VIEW"}
      <div class="grid items-start gap-4 mt-4">
        <div class="grid gap-2">
          <Label for="surname">Surname</Label>
          <span
            class="flex capitalize h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="surname"
          >
            {attendanceRegisterStudentData.surname}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="other-names">Other names</Label>
          <span
            class="flex capitalize h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="others-names"
          >
            {attendanceRegisterStudentData.otherNames}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="regno">Regno</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="regno"
          >
            {attendanceRegisterStudentData.regno}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="gender">Gender</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="gender"
          >
            {attendanceRegisterStudentData.gender}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="level">Level</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="level"
          >
            {(attendanceRegisterStudentData.level || "L_100").replace(
              "L_",
              String()
            )}L
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="department">Department</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="department"
          >
            {attendanceRegisterStudentData.department}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="faculty">Faculty</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="faculty"
          >
            {attendanceRegisterStudentData.faculty}
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
                class="w-full h-fit justify-between font-normal {attendanceRegisterStudentData.regno ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if attendanceRegisterStudentData.regno}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {attendanceRegisterStudentData.name}
                    </p>
                    <p class="text-sm text-muted-foreground truncate text-left">
                      {attendanceRegisterStudentData.regno}
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
                        {#if !excludedStudentsRegno.includes(student.regno)}
                          <Command.Item
                            onSelect={() => {
                              attendanceRegisterStudentData.studentId =
                                student.id;
                              onStudentSelected(student.name, student.regno);
                              closeAndFocusTrigger(ids.trigger);
                            }}
                            value={`${student.regno} ${student.name}`}
                          >
                            <Check
                              class={cn(
                                "mr-2 h-4 w-4",
                                student.regno !==
                                  attendanceRegisterStudentData.regno &&
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
                        {/if}
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
