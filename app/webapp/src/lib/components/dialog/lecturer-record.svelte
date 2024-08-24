<script lang="ts">
  import { LoaderCircle, ChevronsUpDown, Check } from "lucide-svelte/icons";
  import { showToast } from "@/utils";
  import * as Sheet from "@/components/ui/sheet";
  import * as Command from "@/components/ui/command";
  import * as Popover from "@/components/ui/popover";
  import { faker } from "@faker-js/faker";
  import {
    createLecturer,
    updateLecturer,
    getDepartments,
    type DepartmentModel,
    type LecturerModel,
  } from "@/services";
  import { cn } from "@/utils.js";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher, tick } from "svelte";
  import { Label } from "@/components/ui/label";
  import { Input } from "@/components/ui/input";

  export let accessToken: string;

  function show(mode: "CREATE", data: undefined): void;
  function show(mode: "UPDATE" | "VIEW", data: LecturerModel): void;
  export function show(mode: "CREATE" | "UPDATE" | "VIEW", data: any) {
    dialogMode = mode;
    if (mode == "UPDATE" || mode == "VIEW") {
      lecturerData = structuredClone(data);
    }

    lecturerData.username =
      lecturerData.username ||
      faker.internet.userName({ firstName: "lecturer" });

    open = true;

    if (mode != "VIEW") {
      getDepartments({ accessToken, count: "all" })
        .then(({ data }) => {
          departments = data || [];
        })
        .catch(() => {
          departments = [];
        })
        .finally(() => {
          departmentsLoaded = true;
        });
    }
  }

  export function close() {
    internalClose();
    open = false;
  }

  function internalClose() {
    errorMessage = {};
    lecturerData = {};
    departments = [];
    departmentsLoaded = false;
  }

  function onGenderSelected(currentValue: string) {
    lecturerData.gender = currentValue as any;
    genderPopoverOpen = false;
  }

  function onDepartmentSelected(departmentName: string) {
    lecturerData.department = departmentName;
    departmentPopoverOpen = false;
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
      "surname",
      "otherNames",
      "username",
      "gender",
      "department",
    ];

    for (const key of formInputs) {
      if (!Object(lecturerData)[key]) {
        Object(errorMessage)[key] = "Field required";
        requestOngoing = false;
        return;
      }
    }

    try {
      let serviceRequest = null;
      let { departmentId, surname, otherNames, gender, username } =
        lecturerData as Required<LecturerModel & { departmentId: string }>;

      if (dialogMode == "CREATE") {
        serviceRequest = await createLecturer({
          accessToken: accessToken,
          departmentId,
          username,
          surname,
          gender,
          otherNames,
        });
      } else {
        serviceRequest = await updateLecturer({
          accessToken: accessToken,
          id: lecturerData.id as string,
          departmentId,
          username,
          surname,
          gender,
          otherNames,
        });
      }

      if (serviceRequest.error) {
        requestOngoing = false;
        if (
          serviceRequest.error.code >= 1001 &&
          serviceRequest.error.code < 1004
        ) {
          close();
          dispatch("sessionError");
        } else if (serviceRequest.error.code == 2006) {
          errorMessage.username = serviceRequest.error.message;
        } else if (serviceRequest.error.code == 3006) {
          errorMessage.department = serviceRequest.error.message;
        } else if (serviceRequest.error.code == 3019) {
          errorMessage.gender = serviceRequest.error.message;
        } else {
          close();
          showToast("ERROR", "Request failed", serviceRequest.error.message);
        }
        return;
      }

      showToast(
        "SUCCESS",
        "Request successful",
        `Lecturer successfully ${dialogMode == "CREATE" ? "created" : "edited"}`
      );
      dispatch("successful");
    } catch {
      showToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  let requestOngoing: boolean = false;
  let lecturerData: Partial<LecturerModel & { departmentId: string }> = {};
  let errorMessage: Partial<
    Record<keyof Omit<typeof lecturerData, "departmentId">, string>
  > = {};
  let open = false;
  let genderPopoverOpen = false;
  let departmentPopoverOpen = false;
  let departmentsLoaded = false;
  let departments: DepartmentModel[] = [];
  let dialogMode: "CREATE" | "UPDATE" | "VIEW" = "CREATE";
  let dispatch = createEventDispatcher();

  $: dialogTitle =
    dialogMode == "VIEW"
      ? "Lecturer details"
      : `${dialogMode == "CREATE" ? "Create" : "Edit"} lecturer`;
  $: dialogDescription =
    dialogMode == "VIEW"
      ? "Complete information about the lecturer."
      : `${
          dialogMode == "CREATE"
            ? "Create a new lecturer here. Click create when you're done."
            : "Make changes to the lecturer here. Click save when you're done."
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
      <div class="grid gap-2">
        <Label for="surname">Surname</Label>
        {#if dialogMode == "VIEW"}
          <span
            class="flex capitalize h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="surname"
          >
            {lecturerData.surname}
          </span>
        {:else}
          <Input
            placeholder="Lecturer surname"
            type="text"
            id="surname"
            bind:value={lecturerData.surname}
          />
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.surname &&
              'hidden'}"
          >
            {errorMessage.surname}
          </p>
        {/if}
      </div>
      <div class="grid gap-2">
        <Label for="other-names">Other names</Label>
        {#if dialogMode == "VIEW"}
          <span
            class="flex capitalize h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="others-names"
          >
            {lecturerData.otherNames}
          </span>
        {:else}
          <Input
            placeholder="Lecturer other names"
            type="text"
            id="other-names"
            bind:value={lecturerData.otherNames}
          />
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.otherNames &&
              'hidden'}"
          >
            {errorMessage.otherNames}
          </p>
        {/if}
      </div>
      <div class="grid gap-2">
        <Label>Department</Label>
        {#if dialogMode == "VIEW"}
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {lecturerData.department}
          </span>
        {:else}
          <Popover.Root bind:open={departmentPopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={departmentPopoverOpen}
                class="w-full justify-between font-normal {lecturerData.department ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if lecturerData.department}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {lecturerData.department}
                    </p>
                  </div>
                {:else}
                  Select department
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0" style="width: calc(100% - 3rem)">
              <Command.Root loop>
                <Command.Input placeholder="Search department..." />
                <Command.List>
                  {#if departmentsLoaded}
                    <Command.Empty>No department found.</Command.Empty>
                    <Command.Group class="overflow-auto max-h-52">
                      {#each departments as department}
                        <Command.Item
                          onSelect={(currentValue) => {
                            lecturerData.departmentId = department.id;
                            onDepartmentSelected(currentValue);
                            closeAndFocusTrigger(ids.trigger);
                          }}
                          value={department.name}
                        >
                          <Check
                            class={cn(
                              "mr-2 h-4 w-4",
                              lecturerData.department !== department.name &&
                                "text-transparent"
                            )}
                          />
                          {department.name}
                        </Command.Item>
                      {/each}
                    </Command.Group>
                  {:else}
                    <Command.Loading class="py-6 text-center text-sm">
                      Loading departments...
                    </Command.Loading>
                  {/if}
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.department &&
              'hidden'}"
          >
            {errorMessage.department}
          </p>
        {/if}
      </div>
      {#if dialogMode == "VIEW"}
        <div class="grid gap-2">
          <Label for="faculty">Faculty</Label>
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="faculty"
          >
            {lecturerData.faculty}
          </span>
        </div>
      {/if}
      <div class="grid gap-2">
        <Label>Gender</Label>
        {#if dialogMode == "VIEW"}
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {lecturerData.gender}
          </span>
        {:else}
          <Popover.Root bind:open={genderPopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={genderPopoverOpen}
                class="w-full justify-between font-normal {lecturerData.gender ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if lecturerData.gender}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {lecturerData.gender}
                    </p>
                  </div>
                {:else}
                  Select gender
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0" style="width: calc(100% - 3rem)">
              <Command.Root loop>
                <Command.Input placeholder="Search semester..." />
                <Command.List>
                  <Command.Empty>No gender found.</Command.Empty>
                  <Command.Group class="overflow-auto max-h-52">
                    {#each ["MALE", "FEMALE"] as gender}
                      <Command.Item
                        onSelect={(currentValue) => {
                          onGenderSelected(currentValue);
                          closeAndFocusTrigger(ids.trigger);
                        }}
                        value={gender}
                      >
                        <Check
                          class={cn(
                            "mr-2 h-4 w-4",
                            lecturerData.gender !== gender && "text-transparent"
                          )}
                        />
                        {gender}
                      </Command.Item>
                    {/each}
                  </Command.Group>
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.gender &&
              'hidden'}"
          >
            {errorMessage.gender}
          </p>
        {/if}
      </div>
      <div class="grid gap-2">
        <Label for="username">Username</Label>
        {#if dialogMode == "VIEW"}
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="username"
          >
            {lecturerData.username}
          </span>
        {:else}
          <Input
            placeholder="Lecturer username"
            type="text"
            id="username"
            bind:value={lecturerData.username}
          />
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.username &&
              'hidden'}"
          >
            {errorMessage.username}
          </p>
        {/if}
      </div>
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
