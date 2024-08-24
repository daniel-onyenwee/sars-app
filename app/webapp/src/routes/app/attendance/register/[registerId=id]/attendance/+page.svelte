<script lang="ts">
  import type { PageData } from "./$types";
  import { Ellipsis, LoaderCircle } from "lucide-svelte/icons";
  import { Button } from "@/components/ui/button";
  import * as Card from "@/components/ui/card";
  import { Skeleton } from "@/components/ui/skeleton";
  import * as DropdownMenu from "@/components/ui/dropdown-menu";
  import * as Table from "@/components/ui/table";
  import { getAttendanceRegisterAttendances } from "@/services";
  import type {
    AttendanceRegisterAttendanceSortByOption,
    AttendanceRegisterAttendanceModel,
    AttendanceRegisterAttendanceFilterByOption,
  } from "@/services";
  import { formatDate } from "date-fns";
  import { onMount } from "svelte";
  import { formatNumber, sleep } from "@/utils";
  import SortWorker from "@/web-workers/sort?worker";
  import {
    SessionAlertDialog,
    AttendanceRegisterAttendanceRecordDialog,
  } from "@/components/dialog";
  import { SortByMenu, FilterByMenu } from "@/components/menu";
  import { Badge } from "@/components/ui/badge";

  export let data: PageData;

  function onSortBy(by: string) {
    if (!sortWorker) return;

    if (sortBy.by != by) {
      sortBy.ascending = true;
      sortBy.by = by as any;
    } else {
      sortBy.ascending = !sortBy.ascending;
    }

    sortWorker.postMessage({
      type: "ATTENDANCE_REGISTER_ATTENDANCE",
      mode: "REQUEST",
      payload: attendanceRegisterAttendances,
      sortOptions: sortBy,
    });
  }

  async function onLoadMore() {
    let itemsRemaining = 0;
    requestOngoing = true;
    await sleep(500);
    try {
      if (attendanceRegisterAttendances.length >= currentPage * maxItem) {
        currentPage += 1;
      } else {
        itemsRemaining = maxItem - attendanceRegisterAttendances.length;
      }
      await loadData(currentPage, itemsRemaining);
      requestOngoing = false;

      if (sortWorker) {
        sortWorker.postMessage({
          type: "ATTENDANCE_REGISTER_ATTENDANCE",
          mode: "REQUEST",
          payload: attendanceRegisterAttendances,
          sortOptions: sortBy,
        });
      }
    } catch (error) {
      sessionAlertDialog.show();
    }
  }

  async function loadData(page: number = 1, itemsRemaining: number = 0) {
    let serviceResponse = await getAttendanceRegisterAttendances({
      accessToken: data.session.accessToken,
      filter: filterBy,
      count: maxItem,
      sort: sortBy,
      registerId: data.attendanceRegister.id,
      page,
    });

    if (serviceResponse.data) {
      attendanceRegisterAttendances = [
        ...attendanceRegisterAttendances,
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
    attendanceRegisterAttendances = [];
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
      regno: String(),
    };
    await initializeData();
  }

  const sortOptions = [
    { name: "Name", value: "name" },
    { name: "Regno", value: "regno" },
  ];
  const maxItem = 25;

  let sortBy: AttendanceRegisterAttendanceSortByOption = {
    by: "regno",
    ascending: true,
  };
  let filterBy: AttendanceRegisterAttendanceFilterByOption = {
    name: String(),
    regno: String(),
  };
  let filterScheme: { [name: string]: App.FilterByScheme } = {
    gender: {
      type: "select",
      options: ["MALE", "FEMALE"],
    },
  };
  let attendanceRegisterAttendances: AttendanceRegisterAttendanceModel[] = [];
  let currentPage = 1;
  let requestOngoing = false;
  let initialDataLoaded = false;
  let sortWorker: Worker;
  let sessionAlertDialog: SessionAlertDialog;
  let attendanceRegisterAttendanceRecordDialog: AttendanceRegisterAttendanceRecordDialog;

  onMount(async () => {
    sortWorker = new SortWorker();
    sortWorker.addEventListener("message", (e) => {
      const { type, payload, mode } = e.data;
      if (type == "ATTENDANCE_REGISTER_ATTENDANCE" && mode == "RESPONSE") {
        attendanceRegisterAttendances = payload;
      }
    });

    await initializeData();
  });
</script>

<div class="flex items-center gap-1 justify-end mb-3">
  <div>
    <SortByMenu {sortBy} {sortOptions} {onSortBy} />
    <FilterByMenu
      bind:filterByValue={filterBy}
      filterByScheme={filterScheme}
      description="Find student attendances with these properties."
      {onSearch}
      {onResetSearch}
    />
  </div>
</div>
<Card.Root>
  <Card.Header class="px-7">
    <Card.Title>Student attendances</Card.Title>
    <Card.Description>
      {attendanceRegisterAttendances.length}
      {attendanceRegisterAttendances.length > 1 ? "students" : "student"} found
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="min-w-72 max-w-72 truncate">Name</Table.Head>
          <Table.Head class="min-w-48 max-w-48 truncate">Regno</Table.Head>
          <Table.Head class="min-w-36 max-w-36 truncate">
            Classes attended
          </Table.Head>
          <Table.Head class="min-w-36 max-w-36 truncate">Percentage</Table.Head>
          <Table.Head class="min-w-24 max-w-24 truncate">Decision</Table.Head>
          {#each data.attendanceRegister.classAttendances as classAttendance, _ (classAttendance.id)}
            <Table.Head class="min-w-48 text-center">
              {formatDate(classAttendance.date, "do LLL, yyyy")}
              <br />
              {formatDate(classAttendance.startTime, "hh:mm aaa")} - {formatDate(
                classAttendance.endTime,
                "hh:mm aaa"
              )}
            </Table.Head>
          {/each}
          <Table.Head class="w-[25px]">
            <div class="w-4"></div>
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body class={initialDataLoaded ? "visible" : "hidden"}>
        {#each attendanceRegisterAttendances as attendanceRegisterAttendance, _ (attendanceRegisterAttendance.id)}
          <Table.Row>
            <Table.Cell class="min-w-72 max-w-72 truncate">
              {attendanceRegisterAttendance.name}
            </Table.Cell>
            <Table.Cell class="min-w-48 max-w-48 truncate">
              {attendanceRegisterAttendance.regno}
            </Table.Cell>
            <Table.Cell class="min-w-36 max-w-36 truncate">
              {formatNumber(attendanceRegisterAttendance.classesAttended)} /
              {formatNumber(attendanceRegisterAttendance.numberOfClassTaught)}
            </Table.Cell>
            <Table.Cell class="min-w-36 max-w-36 truncate">
              {attendanceRegisterAttendance.classesAttendedPercentage.toFixed(
                2
              )}%
            </Table.Cell>
            <Table.Cell class="min-w-24 max-w-24 truncate capitalize">
              {attendanceRegisterAttendance.decision.toLowerCase()}
            </Table.Cell>
            {#each data.attendanceRegister.classAttendances as classAttendance, _ (classAttendance.id)}
              <Table.Cell class="min-w-48 text-center">
                <Badge
                  class="text-white {attendanceRegisterAttendance[
                    classAttendance.id
                  ] == 'PRESENT'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'}"
                >
                  {attendanceRegisterAttendance[classAttendance.id]}
                </Badge>
              </Table.Cell>
            {/each}
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
                      attendanceRegisterAttendanceRecordDialog.show(
                        "VIEW",
                        attendanceRegisterAttendance
                      )}
                  >
                    View
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    on:click={() =>
                      attendanceRegisterAttendanceRecordDialog.show(
                        "PRESENT",
                        attendanceRegisterAttendance
                      )}
                  >
                    Mark present
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    on:click={() =>
                      attendanceRegisterAttendanceRecordDialog.show(
                        "ABSENT",
                        attendanceRegisterAttendance
                      )}
                  >
                    Mark absent
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Table.Cell>
          </Table.Row>
        {/each}
        {#if requestOngoing}
          {#each { length: 2 } as _}
            <Table.Row>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              {#each { length: data.attendanceRegister.classAttendances.length } as _}
                <Table.Cell class="w-48">
                  <div class="flex w-full justify-center">
                    <Skeleton class="h-4 w-16" />
                  </div>
                </Table.Cell>
              {/each}
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
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            {#each { length: data.attendanceRegister.classAttendances.length } as _}
              <Table.Cell class="w-48">
                <div class="flex w-full justify-center">
                  <Skeleton class="h-4 w-16" />
                </div>
              </Table.Cell>
            {/each}
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
  {#if attendanceRegisterAttendances.length == 0 && initialDataLoaded && !requestOngoing}
    <div
      class="w-full px-7 py-6 pt-0 flex justify-center text-sm text-muted-foreground font-semibold italic"
    >
      No student attendance found
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
<AttendanceRegisterAttendanceRecordDialog
  accessToken={data.session.accessToken}
  attendanceRegisterId={data.attendanceRegister.id}
  classAttendances={data.attendanceRegister.classAttendances}
  on:sessionError={() => sessionAlertDialog.show()}
  on:successful={async () => await initializeData()}
  bind:this={attendanceRegisterAttendanceRecordDialog}
/>
