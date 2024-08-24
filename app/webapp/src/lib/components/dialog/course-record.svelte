<script lang="ts">
  import { LoaderCircle, ChevronsUpDown, Check } from "lucide-svelte/icons";
  import { showToast } from "@/utils";
  import * as Sheet from "@/components/ui/sheet";
  import * as Command from "@/components/ui/command";
  import * as Popover from "@/components/ui/popover";
  import {
    createCourse,
    updateCourse,
    getDepartments,
    type DepartmentModel,
    type CourseModel,
  } from "@/services";
  import { cn } from "@/utils.js";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher, tick } from "svelte";
  import { Label } from "@/components/ui/label";
  import { Input } from "@/components/ui/input";

  export let accessToken: string;

  function show(mode: "CREATE", data: undefined): void;
  function show(mode: "UPDATE" | "VIEW", data: CourseModel): void;
  export function show(mode: "CREATE" | "UPDATE" | "VIEW", data: any) {
    dialogMode = mode;
    if (mode == "UPDATE" || mode == "VIEW") {
      courseData = structuredClone(data);
    }
    open = true;

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

  export function close() {
    internalClose();
    open = false;
  }

  function internalClose() {
    errorMessage = {};
    courseData = {};
    departments = [];
    departmentsLoaded = false;
  }

  function onSemesterSelected(currentValue: string) {
    courseData.semester = currentValue as any;
    semesterPopoverOpen = false;
  }

  function onLevelSelected(currentValue: string) {
    courseData.level = `L_${currentValue}` as any;
    levelPopoverOpen = false;
  }

  function onDepartmentSelected(departmentName: string) {
    courseData.department = departmentName;
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

    let formInputs = ["title", "code", "level", "semester", "department"];

    for (const key of formInputs) {
      if (!Object(courseData)[key]) {
        Object(errorMessage)[key] = "Field required";
        requestOngoing = false;
        return;
      }
    }

    try {
      let serviceRequest = null;
      let { departmentId, title, code, level, semester } =
        courseData as Required<CourseModel & { departmentId: string }>;

      if (dialogMode == "CREATE") {
        serviceRequest = await createCourse({
          accessToken: accessToken,
          departmentId,
          title,
          code,
          level,
          semester,
        });
      } else {
        serviceRequest = await updateCourse({
          accessToken: accessToken,
          id: courseData.id as string,
          departmentId,
          title,
          code,
          level,
          semester,
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
        } else if (serviceRequest.error.code == 3006) {
          errorMessage.department = serviceRequest.error.message;
        } else if (
          serviceRequest.error.code == 3011 ||
          serviceRequest.error.code == 3014
        ) {
          errorMessage.level = serviceRequest.error.message;
        } else if (serviceRequest.error.code == 3010) {
          errorMessage.code = serviceRequest.error.message;
        } else if (serviceRequest.error.code == 3012) {
          errorMessage.faculty = serviceRequest.error.message;
        } else if (serviceRequest.error.code == 3013) {
          errorMessage.code = "Course code already exist";
        } else {
          close();
          showToast("ERROR", "Request failed", serviceRequest.error.message);
        }
        return;
      }

      showToast(
        "SUCCESS",
        "Request successful",
        `Course successfully ${dialogMode == "CREATE" ? "created" : "edited"}`
      );
      dispatch("successful");
    } catch {
      showToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  let requestOngoing: boolean = false;
  let errorMessage: Partial<Record<keyof CourseModel, string>> = {};
  let courseData: Partial<CourseModel & { departmentId: string }> = {};
  let open = false;
  let levelPopoverOpen = false;
  let semesterPopoverOpen = false;
  let departmentPopoverOpen = false;
  let departmentsLoaded = false;
  let departments: DepartmentModel[] = [];
  let dialogMode: "CREATE" | "UPDATE" | "VIEW" = "CREATE";
  let dispatch = createEventDispatcher();

  $: dialogTitle =
    dialogMode == "VIEW"
      ? "Course details"
      : `${dialogMode == "CREATE" ? "Create" : "Edit"} course`;
  $: dialogDescription =
    dialogMode == "VIEW"
      ? "Complete information about the course."
      : `${
          dialogMode == "CREATE"
            ? "Create a new course here. Click create when you're done."
            : "Make changes to the course here. Click save when you're done."
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
        <Label for="title">Title</Label>
        {#if dialogMode == "VIEW"}
          <span
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="title"
          >
            {courseData.title}
          </span>
        {:else}
          <Input
            placeholder="Course title"
            type="text"
            id="title"
            bind:value={courseData.title}
          />
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.title &&
              'hidden'}"
          >
            {errorMessage.title}
          </p>
        {/if}
      </div>
      <div class="grid gap-2">
        <Label for="code">Code</Label>
        {#if dialogMode == "VIEW"}
          <span
            class="flex capitalize h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="code"
          >
            {courseData.code}
          </span>
        {:else}
          <Input
            placeholder="Course code"
            type="text"
            id="code"
            bind:value={courseData.code}
          />
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.code &&
              'hidden'}"
          >
            {errorMessage.code}
          </p>
        {/if}
      </div>
      <div class="grid gap-2">
        <Label for="department">Department</Label>
        {#if dialogMode == "VIEW"}
          <span
            class="flex capitalize h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="department"
          >
            {courseData.department}
          </span>
        {:else}
          <Popover.Root bind:open={departmentPopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={departmentPopoverOpen}
                class="w-full justify-between font-normal {courseData.department ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if courseData.department}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {courseData.department}
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
                            courseData.departmentId = department.id;
                            onDepartmentSelected(currentValue);
                            closeAndFocusTrigger(ids.trigger);
                          }}
                          value={department.name}
                        >
                          <Check
                            class={cn(
                              "mr-2 h-4 w-4",
                              courseData.department !== department.name &&
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
            {courseData.faculty}
          </span>
        </div>
      {/if}
      <div class="grid gap-2">
        <Label for="semester">Semester</Label>
        {#if dialogMode == "VIEW"}
          <span
            class="flex capitalize h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="semester"
          >
            {courseData.semester}
          </span>
        {:else}
          <Popover.Root bind:open={semesterPopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={semesterPopoverOpen}
                class="w-full justify-between font-normal {courseData.semester ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if courseData.semester}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {courseData.semester}
                    </p>
                  </div>
                {:else}
                  Select semester
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0" style="width: calc(100% - 3rem)">
              <Command.Root loop>
                <Command.Input placeholder="Search semester..." />
                <Command.List>
                  <Command.Empty>No semester found.</Command.Empty>
                  <Command.Group class="overflow-auto max-h-52">
                    {#each ["FIRST", "SECOND"] as semester}
                      <Command.Item
                        onSelect={(currentValue) => {
                          onSemesterSelected(currentValue);
                          closeAndFocusTrigger(ids.trigger);
                        }}
                        value={semester}
                      >
                        <Check
                          class={cn(
                            "mr-2 h-4 w-4",
                            courseData.semester !== semester &&
                              "text-transparent"
                          )}
                        />
                        {semester}
                      </Command.Item>
                    {/each}
                  </Command.Group>
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.semester &&
              'hidden'}"
          >
            {errorMessage.semester}
          </p>
        {/if}
      </div>
      <div class="grid gap-2">
        <Label for="level">Level</Label>
        {#if dialogMode == "VIEW"}
          <span
            class="flex capitalize h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="level"
          >
            {(courseData.level || "L_100").replace("L_", String())}L
          </span>
        {:else}
          <Popover.Root bind:open={levelPopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={levelPopoverOpen}
                class="w-full justify-between font-normal {courseData.level ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if courseData.level}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {courseData.level.replace("L_", String())}L
                    </p>
                  </div>
                {:else}
                  Select level
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0" style="width: calc(100% - 3rem)">
              <Command.Root loop>
                <Command.Input placeholder="Search level..." />
                <Command.List>
                  <Command.Empty>No level found.</Command.Empty>
                  <Command.Group class="overflow-auto max-h-52">
                    {#each { length: 10 } as _, i}
                      <Command.Item
                        onSelect={(currentValue) => {
                          onLevelSelected(currentValue);
                          closeAndFocusTrigger(ids.trigger);
                        }}
                        value={`${(i + 1) * 100}`}
                      >
                        <Check
                          class={cn(
                            "mr-2 h-4 w-4",
                            courseData.level !== `L_${(i + 1) * 100}` &&
                              "text-transparent"
                          )}
                        />
                        {(i + 1) * 100}L
                      </Command.Item>
                    {/each}
                  </Command.Group>
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.level &&
              'hidden'}"
          >
            {errorMessage.level}
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
