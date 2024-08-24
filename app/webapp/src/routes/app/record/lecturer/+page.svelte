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
  import { getLecturers } from "@/services";
  import type {
    LecturerSortByOption,
    LecturerModel,
    LecturerFilterByOption,
  } from "@/services";
  import { formatDate } from "date-fns";
  import { onMount } from "svelte";
  import { sleep } from "@/utils";
  import SortWorker from "@/web-workers/sort?worker";
  import {
    SessionAlertDialog,
    DeleteRecordDialog,
    LecturerRecordDialog,
  } from "@/components/dialog";
  import { SortByMenu, FilterByMenu } from "@/components/menu";

  export let data: PageData;

  function onLecturerSelected(
    id: string,
    value: boolean | "indeterminate"
  ): void {
    if (value) {
      lecturersSelected.add(id);
    } else {
      lecturersSelected.delete(id);
    }

    lecturersSelected = lecturersSelected;
  }

  function onAllLecturersSelected(value: boolean | "indeterminate") {
    if (value) {
      lecturersSelected = new Set<string>(lecturers.map(({ id }) => id));
    } else {
      lecturersSelected = new Set<string>();
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
      type: "LECTURER",
      mode: "REQUEST",
      payload: lecturers,
      sortOptions: sortBy,
    });
  }

  async function onLoadMore() {
    let itemsRemaining = 0;
    requestOngoing = true;
    await sleep(500);
    try {
      if (lecturers.length >= currentPage * maxItem) {
        currentPage += 1;
      } else {
        itemsRemaining = maxItem - lecturers.length;
      }
      await loadData(currentPage, itemsRemaining);
      requestOngoing = false;

      if (sortWorker) {
        sortWorker.postMessage({
          type: "LECTURER",
          mode: "REQUEST",
          payload: lecturers,
          sortOptions: sortBy,
        });
      }
    } catch (error) {
      sessionAlertDialog.show();
    }
  }

  async function loadData(page: number = 1, itemsRemaining: number = 0) {
    let serviceResponse = await getLecturers({
      accessToken: data.session.accessToken,
      filter: filterBy,
      count: maxItem,
      sort: sortBy,
      page,
    });

    if (serviceResponse.data) {
      lecturers = [
        ...lecturers,
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
    lecturers = [];
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
      gender: String(),
      username: String(),
      department: String(),
      faculty: String(),
    };
    await initializeData();
  }

  async function onDeleteSuccessful() {
    lecturersSelected = new Set<string>();
    await initializeData();
  }

  const sortOptions = [
    { name: "Name", value: "name" },
    { name: "Gender", value: "gender" },
    { name: "Username", value: "username" },
    { name: "Department", value: "department" },
    { name: "Faculty", value: "faculty" },
    { name: "Date created", value: "createdAt" },
    { name: "Last modified", value: "updatedAt" },
  ];
  const maxItem = 25;

  let sortBy: LecturerSortByOption = {
    by: "createdAt",
    ascending: true,
  };
  let filterBy: LecturerFilterByOption = {
    name: String(),
    gender: String(),
    username: String(),
    department: String(),
    faculty: String(),
  };
  let filterScheme: { [name: string]: App.FilterByScheme } = {
    gender: {
      type: "select",
      options: ["MALE", "FEMALE"],
    },
  };
  let lecturers: LecturerModel[] = [];
  let currentPage = 1;
  let requestOngoing = false;
  let initialDataLoaded = false;
  let lecturersSelected = new Set<string>();
  let sortWorker: Worker;
  let sessionAlertDialog: SessionAlertDialog;
  let deleteRecordDialog: DeleteRecordDialog;
  let lecturerRecordDialog: LecturerRecordDialog;

  onMount(async () => {
    sortWorker = new SortWorker();
    sortWorker.addEventListener("message", (e) => {
      const { type, payload, mode } = e.data;
      if (type == "LECTURER" && mode == "RESPONSE") {
        lecturers = payload;
      }
    });

    await initializeData();
  });
</script>

<div class="flex items-center gap-1 justify-between mb-3">
  <Button
    on:click={() => lecturerRecordDialog.show("CREATE", undefined)}
    class="h-9 gap-1.5  {lecturersSelected.size > 0 && 'hidden'}"
  >
    <CirclePlus class="h-3.5 w-3.5" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Add Lecturer
    </span>
  </Button>
  <Button
    variant="destructive"
    on:click={() => deleteRecordDialog.show(Array.from(lecturersSelected))}
    class="h-9 gap-1  {lecturersSelected.size == 0 && 'hidden'}"
  >
    <Trash2 class="h-4 w-4" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Delete {`(${lecturersSelected.size})`}
    </span>
  </Button>
  <div>
    <SortByMenu {sortBy} {sortOptions} {onSortBy} />
    <FilterByMenu
      bind:filterByValue={filterBy}
      filterByScheme={filterScheme}
      description="Find courses with these properties."
      {onSearch}
      {onResetSearch}
    />
  </div>
</div>
<Card.Root>
  <Card.Header class="px-7">
    <Card.Title>Lecturer</Card.Title>
    <Card.Description>
      {lecturers.length}
      {lecturers.length > 1 ? "lecturers" : "lecturer"} found
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-[35px]">
            <Checkbox
              onCheckedChange={onAllLecturersSelected}
              checked={lecturers.length > 0 &&
                lecturers.length == lecturersSelected.size}
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
        {#each lecturers as lecturer, _ (lecturer.id)}
          <Table.Row>
            <Table.Cell>
              <Checkbox
                checked={lecturersSelected.has(lecturer.id)}
                onCheckedChange={(value) =>
                  onLecturerSelected(lecturer.id, value)}
              />
            </Table.Cell>
            <Table.Cell class="min-w-72 max-w-72 truncate">
              {lecturer.name}
            </Table.Cell>
            <Table.Cell class="min-w-52 max-w-52 truncate">
              {lecturer.username}
            </Table.Cell>
            <Table.Cell class="min-w-28">
              <Badge variant="default">
                {lecturer.gender}
              </Badge>
            </Table.Cell>
            <Table.Cell class="min-w-[215px] max-w-[215px] truncate">
              {lecturer.department}
            </Table.Cell>
            <Table.Cell class="min-w-[215px] max-w-[215px] truncate">
              {lecturer.faculty}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(lecturer.createdAt, "yyy-LL-dd")}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(lecturer.updatedAt, "yyy-LL-dd")}
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
                    on:click={() => lecturerRecordDialog.show("VIEW", lecturer)}
                    >View</DropdownMenu.Item
                  >
                  <DropdownMenu.Item
                    on:click={() =>
                      lecturerRecordDialog.show("UPDATE", lecturer)}
                    >Edit</DropdownMenu.Item
                  >
                  <DropdownMenu.Item
                    on:click={() => deleteRecordDialog.show([lecturer.id])}
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
  {#if lecturers.length == 0 && initialDataLoaded && !requestOngoing}
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
<LecturerRecordDialog
  accessToken={data.session.accessToken}
  on:sessionError={() => sessionAlertDialog.show()}
  on:successful={async () => await initializeData()}
  bind:this={lecturerRecordDialog}
/>
<DeleteRecordDialog
  type="LECTURER"
  accessToken={data.session.accessToken}
  on:sessionError={() => sessionAlertDialog.show()}
  on:successful={onDeleteSuccessful}
  bind:this={deleteRecordDialog}
/>
