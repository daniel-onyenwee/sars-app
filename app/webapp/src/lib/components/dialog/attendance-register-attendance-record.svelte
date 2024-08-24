<script lang="ts">
  import {
    updateAttendanceRegisterAttendance,
    type IClassAttendance,
    type AttendanceRegisterAttendanceModel,
  } from "@/services";
  import { LoaderCircle, ChevronsUpDown, Check } from "lucide-svelte/icons";
  import { capitalizeText, showToast } from "@/utils";
  import * as Command from "@/components/ui/command";
  import * as Popover from "@/components/ui/popover";
  import { cn } from "@/utils.js";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher, tick } from "svelte";
  import { Label } from "@/components/ui/label";
  import * as Sheet from "@/components/ui/sheet";
  import { formatDate, isAfter } from "date-fns";
  import { onMount } from "svelte";

  export let accessToken: string;
  export let attendanceRegisterId: string;
  export let classAttendances: IClassAttendance[];

  export function show(
    mode: "PRESENT" | "ABSENT" | "VIEW",
    data: AttendanceRegisterAttendanceModel
  ) {
    dialogMode = mode;
    attendanceRegisterAttendanceData = data;
    open = true;
  }

  function onClassSelected(
    classDate: Date,
    classStartTime: Date,
    classEndTime: Date
  ) {
    classData.date = classDate;
    classData.startTime = classStartTime;
    classData.endTime = classEndTime;
    classPopoverOpen = false;
  }

  function internalClose() {
    attendanceRegisterAttendanceData = {};
    classData = {};
    errorMessage = {};
  }

  export function close() {
    internalClose();
    open = false;
  }

  function closeAndFocusTrigger(triggerId: string) {
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }

  async function onMarkedPresentOrAbsent() {
    requestOngoing = true;

    errorMessage = {};

    if (!classData.date) {
      errorMessage.date = "Field required";
      requestOngoing = false;
      return;
    }

    try {
      let { id: attendanceRegisterStudentId } =
        attendanceRegisterAttendanceData;
      let { id: classAttendanceId } = classData;

      if (!attendanceRegisterStudentId || !classAttendanceId) {
        throw new Error();
      }

      let serviceRequest = await updateAttendanceRegisterAttendance({
        accessToken: accessToken,
        registerId: attendanceRegisterId,
        attendanceRegisterStudentId,
        classAttendanceId,
        status: dialogMode == "PRESENT" ? "PRESENT" : "ABSENT",
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

      showToast(
        "SUCCESS",
        "Request successful",
        `Student attendance successfully edited`
      );
      dispatch("successful");
    } catch {
      showToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  let requestOngoing: boolean = false;
  let classData: Partial<IClassAttendance> = {};
  let errorMessage: Partial<Record<keyof IClassAttendance, string>> = {};
  let classPopoverOpen = false;
  let open = false;
  let attendanceRegisterAttendanceData: Partial<AttendanceRegisterAttendanceModel> =
    {};
  let dialogMode: "PRESENT" | "ABSENT" | "VIEW" = "VIEW";
  let dispatch = createEventDispatcher();

  $: dialogTitle =
    dialogMode == "VIEW"
      ? "Student attendance details"
      : `Edit student attendance`;
  $: dialogDescription =
    dialogMode == "VIEW"
      ? "Complete information about the student attendance."
      : `Mark student attendance ${dialogMode.toLowerCase()}`;
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
          <Label for="surname">Surname</Label>
          <span
            class="flex capitalize h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="surname"
          >
            {attendanceRegisterAttendanceData.surname}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="other-names">Other names</Label>
          <span
            class="flex capitalize h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="others-names"
          >
            {attendanceRegisterAttendanceData.otherNames}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="regno">Regno</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="regno"
          >
            {attendanceRegisterAttendanceData.regno}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="classes-attended">Classes attended</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="classes-attended"
          >
            {attendanceRegisterAttendanceData.classesAttended} / {attendanceRegisterAttendanceData.numberOfClassTaught}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="classes-attended-percentage">
            Classes attended percentage
          </Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="classes-attended-percentage"
          >
            {attendanceRegisterAttendanceData.classesAttendedPercentage?.toFixed(
              2
            )}%
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="decision">Decision</Label>
          <span
            class="flex h-10 w-full capitalize rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="decision"
          >
            {attendanceRegisterAttendanceData.decision?.toLowerCase()}
          </span>
        </div>
        {#each classAttendances as classAttendance}
          <div class="grid gap-2">
            <Label for="regno">
              {formatDate(classAttendance.date, "do LLL, yyyy")} /
              {formatDate(classAttendance.startTime, "hh:mm aaa")} -
              {formatDate(classAttendance.endTime, "hh:mm aaa")}
            </Label>
            <span
              class="flex h-10 w-full capitalize rounded-md border border-input bg-background px-3 py-2 text-sm"
              id="regno"
            >
              {attendanceRegisterAttendanceData[
                classAttendance.id
              ]?.toLowerCase()}
            </span>
          </div>
        {/each}
      </div>
    {:else}
      <form class="grid items-start gap-4 mt-4">
        <div class="grid gap-2">
          <Label>Class</Label>
          <Popover.Root bind:open={classPopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={classPopoverOpen}
                class="w-full h-fit justify-between font-normal {classData.id ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if classData.date && classData.endTime && classData.startTime}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {formatDate(classData.date, "do LLL, yyyy")}
                    </p>
                    <p class="text-sm text-muted-foreground truncate text-left">
                      {formatDate(classData.startTime, "hh:mm aaa")} -
                      {formatDate(classData.endTime, "hh:mm aaa")}
                    </p>
                  </div>
                {:else}
                  Select class
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0" style="width: calc(100% - 3rem)">
              <Command.Root loop>
                <Command.Input placeholder="Search class..." />
                <Command.List>
                  <Command.Empty>No class found.</Command.Empty>
                  <Command.Group class="overflow-auto max-h-52">
                    {#each classAttendances as classAttendance}
                      <Command.Item
                        onSelect={() => {
                          classData.id = classAttendance.id;
                          onClassSelected(
                            classAttendance.date,
                            classAttendance.startTime,
                            classAttendance.endTime
                          );
                          closeAndFocusTrigger(ids.trigger);
                        }}
                        value={`${formatDate(classAttendance.date, "do LLLL, yyyy")} ${formatDate(classAttendance.startTime, "hh:mm aaa")} ${formatDate(classAttendance.endTime, "hh:mm aaa")}`}
                      >
                        <Check
                          class={cn(
                            "mr-2 h-4 w-4",
                            classData.id !== classAttendance.id &&
                              "text-transparent"
                          )}
                        />
                        <div
                          style="width: calc(100% - 20px)"
                          class="grid gap-1"
                        >
                          <span
                            >{formatDate(
                              classAttendance.date,
                              "do LLL, yyyy"
                            )}</span
                          >
                          <span class="text-sm text-muted-foreground">
                            {formatDate(classAttendance.startTime, "hh:mm aaa")}
                            -
                            {formatDate(classAttendance.endTime, "hh:mm aaa")}
                          </span>
                        </div>
                      </Command.Item>
                    {/each}
                  </Command.Group>
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.date &&
              'hidden'}"
          >
            {errorMessage.date}
          </p>
        </div>
        <Button
          type="submit"
          on:click={onMarkedPresentOrAbsent}
          disabled={requestOngoing}
        >
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing
            ? `Mark ${capitalizeText(dialogMode.toLowerCase())}`
            : "Please wait"}
        </Button>
      </form>
    {/if}
  </Sheet.Content>
</Sheet.Root>
