<script lang="ts">
  import type { PageData } from "./$types";
  import {
    CirclePlus,
    Ellipsis,
    LoaderCircle,
    Trash2,
  } from "lucide-svelte/icons";
  import { Button } from "@/components/ui/button";
  import * as Card from "@/components/ui/card";
  import { Skeleton } from "@/components/ui/skeleton";
  import { Checkbox } from "@/components/ui/checkbox";
  import { Badge } from "@/components/ui/badge";
  import * as DropdownMenu from "@/components/ui/dropdown-menu";
  import * as Table from "@/components/ui/table";
  import { getAttendanceRegisters } from "@/services";
  import type {
    AttendanceRegisterSortByOption,
    AttendanceRegisterModel,
    AttendanceRegisterFilterByOption,
  } from "@/services";
  import { formatDate } from "date-fns";
  import { onMount } from "svelte";
  import { sleep } from "@/utils";
  import SortWorker from "@/web-workers/sort?worker";
  import {
    SessionAlertDialog,
    AttendanceRegisterDialog,
    DeleteRegisterRecordDialog,
  } from "@/components/dialog";
  import { SortByMenu, FilterByMenu } from "@/components/menu";

  export let data: PageData;

  function onAttendanceRegisterSelected(
    id: string,
    value: boolean | "indeterminate"
  ): void {
    if (value) {
      attendanceRegistersSelected.add(id);
    } else {
      attendanceRegistersSelected.delete(id);
    }

    attendanceRegistersSelected = attendanceRegistersSelected;
  }

  function onAllAttendanceRegistersSelected(value: boolean | "indeterminate") {
    if (value) {
      attendanceRegistersSelected = new Set<string>(
        attendanceRegisters.map(({ id }) => id)
      );
    } else {
      attendanceRegistersSelected = new Set<string>();
    }
  }

  function onSortBy(by: string) {
    if (!sortWorker) return;

    if (sortBy.by != by) {
      sortBy.ascending = true;
      sortBy.by = by as any;
    } else {
      sortBy.ascending = !sortBy.ascending;
    }

    sortWorker.postMessage({
      type: "ATTENDANCE_REGISTER",
      mode: "REQUEST",
      payload: attendanceRegisters,
      sortOptions: sortBy,
    });
  }

  async function onLoadMore() {
    let itemsRemaining = 0;
    requestOngoing = true;
    await sleep(500);
    try {
      if (attendanceRegisters.length >= currentPage * maxItem) {
        currentPage += 1;
      } else {
        itemsRemaining = maxItem - attendanceRegisters.length;
      }
      await loadData(currentPage, itemsRemaining);
      requestOngoing = false;

      if (sortWorker) {
        sortWorker.postMessage({
          type: "ATTENDANCE_REGISTER",
          mode: "REQUEST",
          payload: attendanceRegisters,
          sortOptions: sortBy,
        });
      }
    } catch (error) {
      sessionAlertDialog.show();
    }
  }

  async function loadData(page: number = 1, itemsRemaining: number = 0) {
    let serviceResponse = await getAttendanceRegisters({
      accessToken: data.session.accessToken,
      filter: filterBy,
      sort: sortBy,
      count: maxItem,
      page,
    });

    if (serviceResponse.data) {
      attendanceRegisters = [
        ...attendanceRegisters,
        ...serviceResponse.data.slice(
          itemsRemaining ? maxItem - itemsRemaining : 0
        ),
      ];
      return;
    } else {
      throw new Error(JSON.stringify(serviceResponse.error));
    }
  }

  async function initializeData() {
    attendanceRegisters = [];
    initialDataLoaded = false;
    currentPage = 1;
    try {
      await loadData(currentPage);
      initialDataLoaded = true;
    } catch (error) {
      sessionAlertDialog.show();
    }
  }

  async function onSearch() {
    await initializeData();
  }

  async function onResetSearch() {
    filterBy = {
      courseTitle: String(),
      courseCode: String(),
      session: String(),
      semester: String(),
      level: String(),
      department: String(),
      faculty: String(),
    };
    await initializeData();
  }

  async function onDeleteSuccessful() {
    attendanceRegistersSelected = new Set<string>();
    await initializeData();
  }

  const sortOptions = [
    { name: "Course title", value: "courseTitle" },
    { name: "Course code", value: "courseCode" },
    { name: "Session", value: "session" },
    { name: "Semester", value: "semester" },
    { name: "Level", value: "level" },
    { name: "Department", value: "department" },
    { name: "Faculty", value: "faculty" },
    { name: "Date created", value: "createdAt" },
    { name: "Last modified", value: "updatedAt" },
  ];
  const maxItem = 25;

  let sortBy: AttendanceRegisterSortByOption = {
    by: "createdAt",
    ascending: true,
  };
  let filterBy: AttendanceRegisterFilterByOption = {
    courseTitle: String(),
    courseCode: String(),
    session: String(),
    semester: String(),
    level: String(),
    department: String(),
    faculty: String(),
  };
  let filterScheme: { [name: string]: App.FilterByScheme } = {
    courseTitle: {
      label: "Course title",
      type: "text",
    },
    courseCode: {
      label: "Course code",
      type: "text",
    },
    semester: {
      type: "select",
      options: ["FIRST", "SECOND"],
    },
    level: {
      type: "select",
      options: [
        { label: "100L", value: "L_100" },
        { label: "200L", value: "L_200" },
        { label: "300L", value: "L_300" },
        { label: "400L", value: "L_400" },
        { label: "500L", value: "L_500" },
        { label: "600L", value: "L_600" },
        { label: "700L", value: "L_700" },
        { label: "800L", value: "L_800" },
        { label: "900L", value: "L_900" },
        { label: "1000L", value: "L_1000" },
      ],
    },
  };
  let attendanceRegisters: AttendanceRegisterModel[] = [];
  let currentPage = 1;
  let requestOngoing = false;
  let initialDataLoaded = false;
  let attendanceRegistersSelected = new Set<string>();
  let sortWorker: Worker;
  let sessionAlertDialog: SessionAlertDialog;
  let deleteRegisterRecordDialog: DeleteRegisterRecordDialog;
  let attendanceRegisterDialog: AttendanceRegisterDialog;

  onMount(async () => {
    sortWorker = new SortWorker();
    sortWorker.addEventListener("message", (e) => {
      const { type, payload, mode } = e.data;
      if (type == "ATTENDANCE_REGISTER" && mode == "RESPONSE") {
        attendanceRegisters = payload;
      }
    });

    await initializeData();
  });
</script>

<div class="flex items-center gap-1 justify-between mb-3">
  <Button
    on:click={() => attendanceRegisterDialog.show("CREATE", undefined)}
    class="h-9 gap-1.5  {attendanceRegistersSelected.size > 0 && 'hidden'}"
  >
    <CirclePlus class="h-3.5 w-3.5" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Add Register
    </span>
  </Button>
  <Button
    variant="destructive"
    on:click={() =>
      deleteRegisterRecordDialog.show(Array.from(attendanceRegistersSelected))}
    class="h-9 gap-1  {attendanceRegistersSelected.size == 0 && 'hidden'}"
  >
    <Trash2 class="h-4 w-4" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Delete {`(${attendanceRegistersSelected.size})`}
    </span>
  </Button>
  <div>
    <SortByMenu {sortBy} {sortOptions} {onSortBy} />
    <FilterByMenu
      bind:filterByValue={filterBy}
      filterByScheme={filterScheme}
      description="Find registers with these properties."
      {onSearch}
      {onResetSearch}
    />
  </div>
</div>
<Card.Root>
  <Card.Header class="px-7">
    <Card.Title>Registers</Card.Title>
    <Card.Description>
      {attendanceRegisters.length}
      {attendanceRegisters.length > 1 ? "registers" : "register"} found
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-[35px]">
            <Checkbox
              onCheckedChange={onAllAttendanceRegistersSelected}
              checked={attendanceRegisters.length > 0 &&
                attendanceRegisters.length == attendanceRegistersSelected.size}
            />
          </Table.Head>
          <Table.Head class="min-w-72 max-w-72 truncate">
            Course title
          </Table.Head>
          <Table.Head class="min-w-28 max-w-28 truncate">
            Course code
          </Table.Head>
          <Table.Head class="min-w-28 max-w-28 truncate">Semester</Table.Head>
          <Table.Head class="min-w-24 max-w-24 truncate">Level</Table.Head>
          <Table.Head class="min-w-28 max-w-28 truncate">Session</Table.Head>
          <Table.Head class="min-w-[215px] max-w-[215px] truncate">
            Department
          </Table.Head>
          <Table.Head class="min-w-[215px] max-w-[215px] truncate">
            Faculty
          </Table.Head>
          <Table.Head class="min-w-[115px]">Created at</Table.Head>
          <Table.Head class="min-w-[115px]">Modified at</Table.Head>
          <Table.Head class="w-[25px]">
            <div class="w-4"></div>
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body class={initialDataLoaded ? "visible" : "hidden"}>
        {#each attendanceRegisters as attendanceRegister, _ (attendanceRegister.id)}
          <Table.Row>
            <Table.Cell>
              <Checkbox
                checked={attendanceRegistersSelected.has(attendanceRegister.id)}
                onCheckedChange={(value) =>
                  onAttendanceRegisterSelected(attendanceRegister.id, value)}
              />
            </Table.Cell>
            <Table.Cell class="min-w-72 max-w-72 truncate">
              {attendanceRegister.courseTitle}
            </Table.Cell>
            <Table.Cell class="min-w-28 max-w-28 truncate">
              {attendanceRegister.courseCode}
            </Table.Cell>
            <Table.Cell class="min-w-28 max-w-28 truncate">
              <Badge variant="default">
                {attendanceRegister.semester}
              </Badge>
            </Table.Cell>
            <Table.Cell class="min-w-24 max-w-24 truncate">
              <Badge variant="outline">
                {attendanceRegister.level.replace("L_", String())}L
              </Badge>
            </Table.Cell>
            <Table.Cell class="min-w-28 max-w-28 truncate">
              {attendanceRegister.session}
            </Table.Cell>
            <Table.Cell class="min-w-[215px] max-w-[215px] truncate">
              {attendanceRegister.department}
            </Table.Cell>
            <Table.Cell class="min-w-[215px] max-w-[215px] truncate">
              {attendanceRegister.faculty}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(attendanceRegister.createdAt, "yyy-LL-dd")}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(attendanceRegister.updatedAt, "yyy-LL-dd")}
            </Table.Cell>
            <Table.Cell class="w-[25px]">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    aria-haspopup="true"
                    size="icon"
                    variant="ghost"
                    builders={[builder]}
                  >
                    <Ellipsis class="h-4 w-4" />
                    <span class="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Label>Actions</DropdownMenu.Label>
                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger>
                      View
                      <DropdownMenu.SubContent>
                        <DropdownMenu.Item
                          on:click={() =>
                            attendanceRegisterDialog.show(
                              "VIEW",
                              attendanceRegister
                            )}>Details</DropdownMenu.Item
                        >
                        <DropdownMenu.Item
                          href={`./register/${attendanceRegister.id}/lecturer`}
                        >
                          Lecturers
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          href={`./register/${attendanceRegister.id}/student`}
                        >
                          Students
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          href={`./register/${attendanceRegister.id}/attendance`}
                        >
                          Attendances
                        </DropdownMenu.Item>
                      </DropdownMenu.SubContent>
                    </DropdownMenu.SubTrigger>
                  </DropdownMenu.Sub>
                  <DropdownMenu.Item
                    on:click={() =>
                      attendanceRegisterDialog.show(
                        "UPDATE",
                        attendanceRegister
                      )}>Edit</DropdownMenu.Item
                  >
                  <DropdownMenu.Item
                    on:click={() =>
                      deleteRegisterRecordDialog.show([attendanceRegister.id])}
                    class="text-red-500 data-[highlighted]:bg-red-400 dark:data-[highlighted]:bg-destructive data-[highlighted]:text-white"
                  >
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Table.Cell>
          </Table.Row>
        {/each}
        {#if requestOngoing}
          {#each { length: 2 } as _}
            <Table.Row>
              <Table.Cell class="px-0 pl-4">
                <Skeleton class="h-4 w-4" />
              </Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell class="w-[25px]">
                <div class="flex w-full justify-center">
                  <Skeleton class="h-4 w-4" />
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
      <Table.Body class={!initialDataLoaded ? "visible" : "hidden"}>
        {#each { length: 3 } as _}
          <Table.Row>
            <Table.Cell class="px-0 pl-4">
              <Skeleton class="h-4 w-full" />
            </Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell class="w-[25px]">
              <div class="flex w-full justify-center">
                <Skeleton class="h-4 w-4" />
              </div>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Card.Content>
  {#if attendanceRegisters.length == 0 && initialDataLoaded && !requestOngoing}
    <div
      class="w-full px-7 py-6 pt-0 flex justify-center text-sm text-muted-foreground font-semibold italic"
    >
      No register found
    </div>
  {/if}
  <Card.Footer class="justify-center border-t p-4">
    <Skeleton class="h-7 w-[92px] {initialDataLoaded && 'hidden'}" />
    <Button
      disabled={requestOngoing}
      size="sm"
      variant="ghost"
      on:click={onLoadMore}
      class="gap-1  {!initialDataLoaded && 'hidden'}"
    >
      <LoaderCircle
        class="h-3.5 w-3.5 animate-spin {!requestOngoing && 'hidden'}"
      />
      {!requestOngoing ? "Load more" : "Loading..."}
    </Button>
  </Card.Footer>
</Card.Root>

<SessionAlertDialog bind:this={sessionAlertDialog} />
<AttendanceRegisterDialog
  accessToken={data.session.accessToken}
  on:sessionError={() => sessionAlertDialog.show()}
  on:successful={async () => await initializeData()}
  bind:this={attendanceRegisterDialog}
/>
<DeleteRegisterRecordDialog
  type="ATTENDANCE_REGISTER"
  accessToken={data.session.accessToken}
  on:sessionError={() => sessionAlertDialog.show()}
  on:successful={onDeleteSuccessful}
  bind:this={deleteRegisterRecordDialog}
/>
