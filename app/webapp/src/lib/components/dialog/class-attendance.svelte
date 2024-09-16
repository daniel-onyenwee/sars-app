<script lang="ts">
  import { LoaderCircle, ChevronsUpDown, Check } from "lucide-svelte/icons";
  import { showToast } from "@/utils";
  import * as Sheet from "@/components/ui/sheet";
  import * as Command from "@/components/ui/command";
  import * as Popover from "@/components/ui/popover";
  import {
    createClassAttendance,
    updateClassAttendance,
    getAttendanceRegisters,
    getAttendanceRegisterLecturers,
  } from "@/services";
  import type {
    ClassAttendanceModel,
    AttendanceRegisterLecturerModel,
    AttendanceRegisterModel,
  } from "@/services";
  import { cn } from "@/utils.js";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher, tick } from "svelte";
  import { Label } from "@/components/ui/label";
  import { Input } from "@/components/ui/input";
  import { formatDate, toDate, isAfter, differenceInHours } from "date-fns";

  export let accessToken: string;

  function show(mode: "CREATE", data: undefined): void;
  function show(mode: "UPDATE" | "VIEW", data: ClassAttendanceModel): void;
  export function show(mode: "CREATE" | "UPDATE" | "VIEW", data: any) {
    dialogMode = mode;
    if (mode == "UPDATE" || mode == "VIEW") {
      classAttendanceData = structuredClone(data);
    }
    open = true;

    getAttendanceRegisters({ accessToken, count: "all" })
      .then(({ data }) => {
        attendanceRegisters = data || [];
      })
      .catch(() => {
        attendanceRegisters = [];
      })
      .finally(() => {
        attendanceRegistersLoaded = true;
        attendanceRegisterLecturers = [];
        attendanceRegisterLecturersLoaded = false;
      });

    if (mode == "UPDATE") {
      getAttendanceRegisters({
        accessToken,
        count: 1,
        filter: {
          session: classAttendanceData.session,
          courseCode: classAttendanceData.courseCode,
        },
      })
        .then(({ data }) => {
          let [register] = data || [];
          if (register) {
            return register;
          } else {
            throw Error();
          }
        })
        .then(({ id }) => {
          return getAttendanceRegisterLecturers({
            accessToken,
            count: "all",
            registerId: id,
          });
        })
        .then(({ data }) => {
          attendanceRegisterLecturers = data || [];
        })
        .catch(() => {
          attendanceRegisters = [];
        })
        .finally(() => {
          attendanceRegisterLecturersLoaded = true;
        });
    }
  }

  export function close() {
    internalClose();
    open = false;
  }

  function internalClose() {
    errorMessage = {};
    attendanceRegisterLecturers = [];
    attendanceRegisterLecturersLoaded = false;
    attendanceRegisters = [];
    attendanceRegistersLoaded = false;
    attendanceRegisterLecturersLoaded = false;
    classAttendanceData = {};
  }

  function onAttendanceRegisterLecturerSelected(
    lecturerUsername: string,
    lecturerName: string
  ) {
    classAttendanceData.lecturerName = lecturerName;
    classAttendanceData.lecturerUsername = lecturerUsername;
    attendanceRegisterLecturerPopoverOpen = false;
  }

  function onEndTimeInput(ev: any) {
    if (!ev.target) return;

    if (Object(ev.target).value) {
      const date = toDate(classAttendanceData.startTime || new Date());
      const [hours, minutes] = Object(ev.target).value.split(":");
      classAttendanceData.endTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hours,
        minutes
      );
    } else {
      classAttendanceData.endTime = undefined;
    }
  }

  function onStartTimeInput(ev: any) {
    if (!ev.target) return;

    if (Object(ev.target).value) {
      const date = toDate(classAttendanceData.startTime || new Date());
      const [hours, minutes] = Object(ev.target).value.split(":");
      classAttendanceData.startTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hours,
        minutes
      );
    } else {
      classAttendanceData.startTime = undefined;
    }
  }

  function onDateInput(ev: any) {
    if (!ev.target) return;

    if (Object(ev.target).value) {
      classAttendanceData.date = new Date(Object(ev.target).value);
    } else {
      classAttendanceData.date = undefined;
    }
  }

  function onAttendanceRegisterSelected(
    courseCode: string,
    courseTitle: string,
    session: string,
    registerId: string
  ) {
    if (
      !(
        classAttendanceData.courseCode == courseCode &&
        classAttendanceData.session == session
      )
    ) {
      attendanceRegisterLecturersLoaded = false;
      attendanceRegisterLecturers = [];
      classAttendanceData.lecturerName = undefined;
      classAttendanceData.lecturerUsername = undefined;

      getAttendanceRegisterLecturers({ accessToken, count: "all", registerId })
        .then(({ data }) => {
          attendanceRegisterLecturers = data || [];
        })
        .catch(() => {
          attendanceRegisters = [];
        })
        .finally(() => {
          attendanceRegisterLecturersLoaded = true;
        });
    }
    classAttendanceData.courseTitle = courseTitle;
    classAttendanceData.courseCode = courseCode;
    classAttendanceData.session = session;
    attendanceRegisterPopoverOpen = false;
  }

  function closeAndFocusTrigger(triggerId: string) {
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }

  async function onCreateOrUpdate() {
    requestOngoing = true;

    errorMessage = {};

    let formInputs = [
      "courseCode",
      "lecturerUsername",
      "date",
      "startTime",
      "endTime",
    ];

    for (const key of formInputs) {
      if (!Object(classAttendanceData)[key]) {
        Object(errorMessage)[key] = "Field required";
        requestOngoing = false;
        return;
      }
    }

    if (
      isAfter(
        classAttendanceData.startTime as any,
        classAttendanceData.endTime as any
      )
    ) {
      errorMessage.startTime = "Start time must precede end time";
      requestOngoing = false;
      return;
    }

    if (
      classAttendanceData.endTime &&
      toDate(classAttendanceData.endTime).getUTCHours() == 0
    ) {
      errorMessage.endTime = "Unsupported time";
      requestOngoing = false;
      return;
    }

    try {
      let serviceRequest = null;
      let {
        attendanceRegisterId,
        attendanceRegisterLecturerId,
        startTime,
        endTime,
        date,
      } = classAttendanceData as Required<
        ClassAttendanceModel & {
          attendanceRegisterId: string;
          attendanceRegisterLecturerId: string;
        }
      >;

      if (dialogMode == "CREATE") {
        serviceRequest = await createClassAttendance({
          accessToken: accessToken,
          attendanceRegisterId,
          attendanceRegisterLecturerId,
          startTime,
          endTime,
          date,
        });
      } else {
        serviceRequest = await updateClassAttendance({
          id: classAttendanceData.id as string,
          accessToken: accessToken,
          attendanceRegisterId,
          attendanceRegisterLecturerId,
          startTime,
          endTime,
          date,
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
        } else if (serviceRequest.error.code == 4033) {
          errorMessage.endTime = serviceRequest.error.message;
        } else if (serviceRequest.error.code == 4014) {
          errorMessage.courseCode = "Register not found";
        } else if (serviceRequest.error.code == 4024) {
          errorMessage.lecturerUsername = "Lecturer not found";
        } else {
          close();
          showToast("ERROR", "Request failed", serviceRequest.error.message);
        }
        return;
      }

      showToast(
        "SUCCESS",
        "Request successful",
        `Class attendance successfully ${dialogMode == "CREATE" ? "created" : "edited"}`
      );
      dispatch("successful", {
        classAttendanceId: serviceRequest.data?.id,
        mode: dialogMode,
      });
    } catch {
      showToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  let requestOngoing: boolean = false;
  let errorMessage: Partial<Record<keyof ClassAttendanceModel, string>> = {};
  let classAttendanceData: Partial<
    ClassAttendanceModel & {
      attendanceRegisterId: string;
      attendanceRegisterLecturerId: string;
    }
  > = {};
  let open = false;
  let attendanceRegisterLecturerPopoverOpen = false;
  let attendanceRegisterPopoverOpen = false;
  let attendanceRegistersLoaded = false;
  let attendanceRegisterLecturersLoaded = false;
  let attendanceRegisterLecturers: AttendanceRegisterLecturerModel[] = [];
  let attendanceRegisters: AttendanceRegisterModel[] = [];
  let dialogMode: "CREATE" | "UPDATE" | "VIEW" = "CREATE";
  let dispatch = createEventDispatcher();

  $: dialogTitle =
    dialogMode == "VIEW"
      ? "Class attendance details"
      : `${dialogMode == "CREATE" ? "Create" : "Edit"} class attendance`;
  $: dialogDescription =
    dialogMode == "VIEW"
      ? "Complete information about the class attendance."
      : `${
          dialogMode == "CREATE"
            ? "Create a new class attendance here. Click create when you're done."
            : "Make changes to the class attendance here. Click save when you're done."
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
    {#if dialogMode == "VIEW"}
      <div class="grid items-start gap-4 mt-4">
        <div class="grid gap-2">
          <Label>Course title</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {classAttendanceData.courseTitle}
          </span>
        </div>
        <div class="grid gap-2">
          <Label>Course code</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {classAttendanceData.courseCode}
          </span>
        </div>
        <div class="grid gap-2">
          <Label>Lecturer name</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {classAttendanceData.lecturerName}
          </span>
        </div>
        <div class="grid gap-2">
          <Label>Date</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {formatDate(classAttendanceData.date || new Date(), "do LLL, yyyy")}
          </span>
        </div>
        <div class="grid gap-2">
          <Label>Start time</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {formatDate(
              classAttendanceData.startTime || new Date(),
              "hh:mm aaa"
            )}
          </span>
        </div>
        <div class="grid gap-2">
          <Label>End time</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {formatDate(classAttendanceData.endTime || new Date(), "hh:mm aaa")}
          </span>
        </div>
        <div class="grid gap-2">
          <Label>Session</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {classAttendanceData.session}
          </span>
        </div>
        <div class="grid gap-2">
          <Label>Department</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {classAttendanceData.department}
          </span>
        </div>
        <div class="grid gap-2">
          <Label>Faculty</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {classAttendanceData.faculty}
          </span>
        </div>
        <div class="grid gap-2">
          <Label>Semester</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {classAttendanceData.semester}
          </span>
        </div>
        <div class="grid gap-2">
          <Label>Level</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {(classAttendanceData.level || "L_100").replace("L_", String())}L
          </span>
        </div>
      </div>
    {:else}
      <form class="grid items-start gap-4 mt-4">
        <div class="grid gap-2">
          <Label>Register</Label>
          <Popover.Root bind:open={attendanceRegisterPopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={attendanceRegisterPopoverOpen}
                class="w-full h-fit justify-between font-normal {classAttendanceData.courseCode ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if classAttendanceData.courseCode}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {classAttendanceData.courseTitle}
                    </p>
                    <p class="text-sm text-muted-foreground truncate text-left">
                      {classAttendanceData.courseCode} &CenterDot; {classAttendanceData.session}
                    </p>
                  </div>
                {:else}
                  Select register
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0" style="width: calc(100% - 3rem)">
              <Command.Root loop>
                <Command.Input placeholder="Search register..." />
                <Command.List>
                  {#if attendanceRegistersLoaded}
                    <Command.Empty>No register found.</Command.Empty>
                    <Command.Group class="overflow-auto max-h-52">
                      {#each attendanceRegisters as attendanceRegister}
                        <Command.Item
                          onSelect={() => {
                            classAttendanceData.attendanceRegisterId =
                              attendanceRegister.id;
                            onAttendanceRegisterSelected(
                              attendanceRegister.courseCode,
                              attendanceRegister.courseTitle,
                              attendanceRegister.session,
                              attendanceRegister.id
                            );
                            closeAndFocusTrigger(ids.trigger);
                          }}
                          value={`${attendanceRegister.courseCode} ${attendanceRegister.courseTitle} ${attendanceRegister.session}`}
                        >
                          <Check
                            class={cn(
                              "mr-2 h-4 w-4",
                              !(
                                attendanceRegister.courseCode ===
                                  classAttendanceData.courseCode &&
                                attendanceRegister.session ===
                                  classAttendanceData.session
                              ) && "text-transparent"
                            )}
                          />
                          <div
                            style="width: calc(100% - 20px)"
                            class="grid gap-1"
                          >
                            <span>{attendanceRegister.courseTitle}</span>
                            <span class="text-sm text-muted-foreground">
                              {attendanceRegister.courseCode} &CenterDot; {attendanceRegister.session}
                            </span>
                          </div>
                        </Command.Item>
                      {/each}
                    </Command.Group>
                  {:else}
                    <Command.Loading class="py-6 text-center text-sm">
                      Loading registers...
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
        <div class="grid gap-2">
          <Label>Lecturer</Label>
          <Popover.Root
            bind:open={attendanceRegisterLecturerPopoverOpen}
            let:ids
          >
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={attendanceRegisterLecturerPopoverOpen}
                class="w-full h-fit justify-between font-normal {classAttendanceData.lecturerUsername ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if classAttendanceData.lecturerUsername}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {classAttendanceData.lecturerName}
                    </p>
                    <p class="text-sm text-muted-foreground truncate text-left">
                      {classAttendanceData.lecturerUsername}
                    </p>
                  </div>
                {:else}
                  Select lecturer
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0" style="width: calc(100% - 3rem)">
              <Command.Root loop>
                <Command.Input placeholder="Search lecturer..." />
                <Command.List>
                  {#if attendanceRegisterLecturersLoaded}
                    <Command.Empty>No lecturer found.</Command.Empty>
                    <Command.Group class="overflow-auto max-h-52">
                      {#each attendanceRegisterLecturers as attendanceRegisterLecturer}
                        <Command.Item
                          onSelect={() => {
                            classAttendanceData.attendanceRegisterLecturerId =
                              attendanceRegisterLecturer.id;
                            onAttendanceRegisterLecturerSelected(
                              attendanceRegisterLecturer.username,
                              attendanceRegisterLecturer.name
                            );
                            closeAndFocusTrigger(ids.trigger);
                          }}
                          value={`${attendanceRegisterLecturer.name} ${attendanceRegisterLecturer.username}`}
                        >
                          <Check
                            class={cn(
                              "mr-2 h-4 w-4",
                              attendanceRegisterLecturer.username !==
                                classAttendanceData.lecturerUsername &&
                                "text-transparent"
                            )}
                          />
                          <div
                            style="width: calc(100% - 20px)"
                            class="grid gap-1"
                          >
                            <span>{attendanceRegisterLecturer.name}</span>
                            <span class="text-sm text-muted-foreground">
                              {attendanceRegisterLecturer.username}
                            </span>
                          </div>
                        </Command.Item>
                      {/each}
                    </Command.Group>
                  {:else}
                    <Command.Loading class="py-6 text-center text-sm">
                      {#if classAttendanceData.attendanceRegisterId}
                        Loading lecturers...
                      {:else}
                        No register selected
                      {/if}
                    </Command.Loading>
                  {/if}
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.lecturerUsername &&
              'hidden'}"
          >
            {errorMessage.lecturerUsername}
          </p>
        </div>
        <div class="grid gap-2">
          <Label>Date</Label>
          <Input
            type="date"
            min={formatDate(new Date(), "yyyy-LL-dd")}
            value={classAttendanceData.date
              ? `${formatDate(classAttendanceData.date, "yyyy-LL-dd")}`
              : String()}
            on:input={onDateInput}
            class="block {classAttendanceData.date == undefined &&
              'text-muted-foreground'}"
          />
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.date &&
              'hidden'}"
          >
            {errorMessage.date}
          </p>
        </div>
        <div class="grid gap-2">
          <Label>Start time</Label>
          <Input
            type="time"
            value={classAttendanceData.startTime
              ? `${formatDate(classAttendanceData.startTime, "HH:mm")}`
              : String()}
            on:input={onStartTimeInput}
            class="block {classAttendanceData.startTime == undefined &&
              'text-muted-foreground'}"
          />
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.startTime &&
              'hidden'}"
          >
            {errorMessage.startTime}
          </p>
        </div>
        <div class="grid gap-2">
          <Label>End time</Label>
          <Input
            type="time"
            value={classAttendanceData.endTime
              ? `${formatDate(classAttendanceData.endTime, "HH:mm")}`
              : String()}
            on:input={onEndTimeInput}
            class="block {classAttendanceData.endTime == undefined &&
              'text-muted-foreground'}"
          />
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.endTime &&
              'hidden'}"
          >
            {errorMessage.endTime}
          </p>
        </div>
        <Button
          type="submit"
          on:click={onCreateOrUpdate}
          disabled={requestOngoing}
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
    {/if}
  </Sheet.Content>
</Sheet.Root>
