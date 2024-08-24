<script lang="ts">
  import { LoaderCircle, ChevronsUpDown, Check } from "lucide-svelte/icons";
  import { showToast } from "@/utils";
  import * as Sheet from "@/components/ui/sheet";
  import * as Command from "@/components/ui/command";
  import * as Popover from "@/components/ui/popover";
  import {
    getLecturers,
    addAttendanceRegisterLecturers,
    type AttendanceRegisterLecturerModel,
    type LecturerModel,
  } from "@/services";
  import { cn } from "@/utils.js";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher, tick } from "svelte";
  import { Label } from "@/components/ui/label";

  export let accessToken: string;
  export let attendanceRegisterId: string;

  function show(mode: "ADD", data: undefined): void;
  function show(mode: "VIEW", data: AttendanceRegisterLecturerModel): void;
  export function show(mode: "ADD" | "VIEW", data: any) {
    dialogMode = mode;
    if (mode == "VIEW") {
      attendanceRegisterLecturerData = structuredClone(data);
    }
    open = true;

    getLecturers({ accessToken, count: "all" })
      .then(({ data }) => {
        lecturers = data || [];
      })
      .catch(() => {
        lecturers = [];
      })
      .finally(() => {
        lecturersLoaded = true;
      });
  }

  function internalClose() {
    errorMessage = {};
    attendanceRegisterLecturerData = {};
    lecturers = [];
    lecturerPopoverOpen = false;
    lecturersLoaded = false;
  }

  export function close() {
    internalClose();
    open = false;
  }

  function onLecturerSelected(lecturerName: string, lecturerUsername: string) {
    attendanceRegisterLecturerData.name = lecturerName;
    attendanceRegisterLecturerData.username = lecturerUsername;
    lecturerPopoverOpen = false;
  }

  function closeAndFocusTrigger(triggerId: string) {
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }

  async function onAdd() {
    requestOngoing = true;

    errorMessage = {};

    let formInputs = ["username"];

    for (const key of formInputs) {
      if (!Object(attendanceRegisterLecturerData)[key]) {
        Object(errorMessage)[key] = "Field required";
        requestOngoing = false;
        return;
      }
    }

    try {
      let { lecturerId } = attendanceRegisterLecturerData;

      if (!lecturerId) {
        throw new Error();
      }

      let serviceRequest = await addAttendanceRegisterLecturers({
        accessToken: accessToken,
        registerId: attendanceRegisterId,
        lecturersId: [lecturerId],
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

      showToast("SUCCESS", "Request successful", `Lecturer successfully added`);
      dispatch("successful");
    } catch {
      showToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  let requestOngoing: boolean = false;
  let errorMessage: Partial<
    Record<keyof AttendanceRegisterLecturerModel, string>
  > = {};
  let attendanceRegisterLecturerData: Partial<
    AttendanceRegisterLecturerModel & { lecturerId: string }
  > = {};
  let open = false;
  let lecturerPopoverOpen = false;
  let lecturersLoaded = false;
  let lecturers: LecturerModel[] = [];
  let dialogMode: "ADD" | "VIEW" = "ADD";
  let dispatch = createEventDispatcher();

  $: dialogTitle = dialogMode == "VIEW" ? "Lecturer details" : `Add lecturer`;
  $: dialogDescription =
    dialogMode == "VIEW"
      ? "Complete information about the lecturer."
      : "Add a lecturer to the register here. Click add when you're done.";
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
            {attendanceRegisterLecturerData.surname}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="other-names">Other names</Label>
          <span
            class="flex capitalize h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="others-names"
          >
            {attendanceRegisterLecturerData.otherNames}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="username">Username</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="username"
          >
            {attendanceRegisterLecturerData.username}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="gender">Gender</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="gender"
          >
            {attendanceRegisterLecturerData.gender}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="department">Department</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="department"
          >
            {attendanceRegisterLecturerData.department}
          </span>
        </div>
        <div class="grid gap-2">
          <Label for="faculty">Faculty</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="faculty"
          >
            {attendanceRegisterLecturerData.faculty}
          </span>
        </div>
      </div>
    {:else}
      <form class="grid items-start gap-4 mt-4">
        <div class="grid gap-2">
          <Label>Lecturer</Label>
          <Popover.Root bind:open={lecturerPopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={lecturerPopoverOpen}
                class="w-full h-fit justify-between font-normal {attendanceRegisterLecturerData.username ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if attendanceRegisterLecturerData.username}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {attendanceRegisterLecturerData.name}
                    </p>
                    <p class="text-sm text-muted-foreground truncate text-left">
                      {attendanceRegisterLecturerData.username}
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
                  {#if lecturersLoaded}
                    <Command.Empty>No lecturer found.</Command.Empty>
                    <Command.Group class="overflow-auto max-h-52">
                      {#each lecturers as lecturer}
                        <Command.Item
                          onSelect={() => {
                            attendanceRegisterLecturerData.lecturerId =
                              lecturer.id;
                            onLecturerSelected(
                              lecturer.name,
                              lecturer.username
                            );
                            closeAndFocusTrigger(ids.trigger);
                          }}
                          value={`${lecturer.username} ${lecturer.name}`}
                        >
                          <Check
                            class={cn(
                              "mr-2 h-4 w-4",
                              lecturer.username !==
                                attendanceRegisterLecturerData.username &&
                                "text-transparent"
                            )}
                          />
                          <div
                            style="width: calc(100% - 20px)"
                            class="grid gap-1"
                          >
                            <span>{lecturer.name}</span>
                            <span class="text-sm text-muted-foreground">
                              {lecturer.username}
                            </span>
                          </div>
                        </Command.Item>
                      {/each}
                    </Command.Group>
                  {:else}
                    <Command.Loading class="py-6 text-center text-sm">
                      Loading lecturers...
                    </Command.Loading>
                  {/if}
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.username &&
              'hidden'}"
          >
            {errorMessage.username}
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
