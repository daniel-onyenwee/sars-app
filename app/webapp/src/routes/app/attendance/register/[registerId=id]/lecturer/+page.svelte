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
  import { getAttendanceRegisterLecturers } from "@/services";
  import type {
    AttendanceRegisterLecturerSortByOption,
    AttendanceRegisterLecturerModel,
    AttendanceRegisterLecturerFilterByOption,
  } from "@/services";
  import { formatDate } from "date-fns";
  import { onMount } from "svelte";
  import { sleep } from "@/utils";
  import SortWorker from "@/web-workers/sort?worker";
  import {
    SessionAlertDialog,
    DeleteRegisterRecordDialog,
    AttendanceRegisterLecturerRecordDialog,
  } from "@/components/dialog";
  import { SortByMenu, FilterByMenu } from "@/components/menu";

  export let data: PageData;

  function onLecturerSelected(
    id: string,
    value: boolean | "indeterminate"
  ): void {
    if (value) {
      attendanceRegisterLecturersSelected.add(id);
    } else {
      attendanceRegisterLecturersSelected.delete(id);
    }

    attendanceRegisterLecturersSelected = attendanceRegisterLecturersSelected;
  }

  function onAllLecturersSelected(value: boolean | "indeterminate") {
    if (value) {
      attendanceRegisterLecturersSelected = new Set<string>(
        attendanceRegisterLecturers.map(({ id }) => id)
      );
    } else {
      attendanceRegisterLecturersSelected = new Set<string>();
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
      type: "ATTENDANCE_REGISTER_LECTURER",
      mode: "REQUEST",
      payload: attendanceRegisterLecturers,
      sortOptions: sortBy,
    });
  }

  async function onLoadMore() {
    let itemsRemaining = 0;
    requestOngoing = true;
    await sleep(500);
    try {
      if (attendanceRegisterLecturers.length >= currentPage * maxItem) {
        currentPage += 1;
      } else {
        itemsRemaining = maxItem - attendanceRegisterLecturers.length;
      }
      await loadData(currentPage, itemsRemaining);
      requestOngoing = false;

      if (sortWorker) {
        sortWorker.postMessage({
          type: "ATTENDANCE_REGISTER_LECTURER",
          mode: "REQUEST",
          payload: attendanceRegisterLecturers,
          sortOptions: sortBy,
        });
      }
    } catch (error) {
      sessionAlertDialog.show();
    }
  }

  async function loadData(page: number = 1, itemsRemaining: number = 0) {
    let serviceResponse = await getAttendanceRegisterLecturers({
      accessToken: data.session.accessToken,
      filter: filterBy,
      count: maxItem,
      sort: sortBy,
      registerId: data.attendanceRegister.id,
      page,
    });

    if (serviceResponse.data) {
      attendanceRegisterLecturers = [
        ...attendanceRegisterLecturers,
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
    attendanceRegisterLecturers = [];
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
      name: String(),
      username: String(),
      gender: String(),
      department: String(),
      faculty: String(),
    };
    await initializeData();
  }

  async function onDeleteSuccessful() {
    attendanceRegisterLecturersSelected = new Set<string>();
    await initializeData();
  }

  const sortOptions = [
    { name: "Name", value: "name" },
    { name: "Username", value: "username" },
    { name: "Gender", value: "gender" },
    { name: "Department", value: "department" },
    { name: "Faculty", value: "faculty" },
    { name: "Date created", value: "createdAt" },
    { name: "Last modified", value: "updatedAt" },
  ];
  const maxItem = 25;

  let sortBy: AttendanceRegisterLecturerSortByOption = {
    by: "createdAt",
    ascending: true,
  };
  let filterBy: AttendanceRegisterLecturerFilterByOption = {
    name: String(),
    username: String(),
    gender: String(),
    department: String(),
    faculty: String(),
  };
  let filterScheme: { [name: string]: App.FilterByScheme } = {
    gender: {
      type: "select",
      options: ["MALE", "FEMALE"],
    },
  };
  let attendanceRegisterLecturers: AttendanceRegisterLecturerModel[] = [];
  let currentPage = 1;
  let requestOngoing = false;
  let initialDataLoaded = false;
  let attendanceRegisterLecturersSelected = new Set<string>();
  let sortWorker: Worker;
  let sessionAlertDialog: SessionAlertDialog;
  let deleteRegisterRecordDialog: DeleteRegisterRecordDialog;
  let attendanceRegisterLecturerRecordDialog: AttendanceRegisterLecturerRecordDialog;

  onMount(async () => {
    sortWorker = new SortWorker();
    sortWorker.addEventListener("message", (e) => {
      const { type, payload, mode } = e.data;
      if (type == "ATTENDANCE_REGISTER_LECTURER" && mode == "RESPONSE") {
        attendanceRegisterLecturers = payload;
      }
    });

    await initializeData();
  });

  $: attendanceRegisterLecturersUsername = attendanceRegisterLecturers.map(
    ({ username }) => username
  );
</script>

<div class="flex items-center gap-1 justify-between mb-3">
  <Button
    on:click={() =>
      attendanceRegisterLecturerRecordDialog.show("ADD", undefined)}
    class="h-9 gap-1.5  {attendanceRegisterLecturersSelected.size > 0 &&
      'hidden'}"
  >
    <CirclePlus class="h-3.5 w-3.5" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Add Lecturer
    </span>
  </Button>
  <Button
    variant="destructive"
    on:click={() =>
      deleteRegisterRecordDialog.show(
        Array.from(attendanceRegisterLecturersSelected),
        data.attendanceRegister.id
      )}
    class="h-9 gap-1  {attendanceRegisterLecturersSelected.size == 0 &&
      'hidden'}"
  >
    <Trash2 class="h-4 w-4" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Delete {`(${attendanceRegisterLecturersSelected.size})`}
    </span>
  </Button>
  <div>
    <SortByMenu {sortBy} {sortOptions} {onSortBy} />
    <FilterByMenu
      bind:filterByValue={filterBy}
      filterByScheme={filterScheme}
      description="Find lecturers with these properties."
      {onSearch}
      {onResetSearch}
    />
  </div>
</div>
<Card.Root>
  <Card.Header class="px-7">
    <Card.Title>Register lecturers</Card.Title>
    <Card.Description>
      {attendanceRegisterLecturers.length}
      {attendanceRegisterLecturers.length > 1 ? "lecturers" : "lecturer"} found
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-[35px]">
            <Checkbox
              onCheckedChange={onAllLecturersSelected}
              checked={attendanceRegisterLecturers.length > 0 &&
                attendanceRegisterLecturers.length ==
                  attendanceRegisterLecturersSelected.size}
            />
          </Table.Head>
          <Table.Head class="min-w-72 max-w-72 truncate">Name</Table.Head>
          <Table.Head class="min-w-52 max-w-52 truncate">Username</Table.Head>
          <Table.Head class="min-w-28">Gender</Table.Head>
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
        {#each attendanceRegisterLecturers as attendanceRegisterLecturer, _ (attendanceRegisterLecturer.id)}
          <Table.Row>
            <Table.Cell>
              <Checkbox
                checked={attendanceRegisterLecturersSelected.has(
                  attendanceRegisterLecturer.id
                )}
                onCheckedChange={(value) =>
                  onLecturerSelected(attendanceRegisterLecturer.id, value)}
              />
            </Table.Cell>
            <Table.Cell class="min-w-72 max-w-72 truncate">
              {attendanceRegisterLecturer.name}
            </Table.Cell>
            <Table.Cell class="min-w-52 max-w-52 truncate">
              {attendanceRegisterLecturer.username}
            </Table.Cell>
            <Table.Cell class="min-w-28">
              <Badge variant="default">
                {attendanceRegisterLecturer.gender}
              </Badge>
            </Table.Cell>
            <Table.Cell class="min-w-[215px] max-w-[215px] truncate">
              {attendanceRegisterLecturer.department}
            </Table.Cell>
            <Table.Cell class="min-w-[215px] max-w-[215px] truncate">
              {attendanceRegisterLecturer.faculty}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(attendanceRegisterLecturer.createdAt, "yyy-LL-dd")}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(attendanceRegisterLecturer.updatedAt, "yyy-LL-dd")}
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
                  <DropdownMenu.Item
                    on:click={() =>
                      attendanceRegisterLecturerRecordDialog.show(
                        "VIEW",
                        attendanceRegisterLecturer
                      )}>View</DropdownMenu.Item
                  >

                  <DropdownMenu.Item
                    on:click={() =>
                      deleteRegisterRecordDialog.show(
                        [attendanceRegisterLecturer.id],
                        data.attendanceRegister.id
                      )}
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
                <Skeleton class="h-4 w-full" />
              </Table.Cell>
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
  {#if attendanceRegisterLecturers.length == 0 && initialDataLoaded && !requestOngoing}
    <div
      class="w-full px-7 py-6 pt-0 flex justify-center text-sm text-muted-foreground font-semibold italic"
    >
      No lecturer found
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
<AttendanceRegisterLecturerRecordDialog
  accessToken={data.session.accessToken}
  attendanceRegisterId={data.attendanceRegister.id}
  bind:excludedLecturersUsername={attendanceRegisterLecturersUsername}
  on:sessionError={() => sessionAlertDialog.show()}
  on:successful={async () => await initializeData()}
  bind:this={attendanceRegisterLecturerRecordDialog}
/>
<DeleteRegisterRecordDialog
  type="ATTENDANCE_REGISTER_LECTURER"
  accessToken={data.session.accessToken}
  on:sessionError={() => sessionAlertDialog.show()}
  on:successful={onDeleteSuccessful}
  bind:this={deleteRegisterRecordDialog}
/>
