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
  import { getDepartments } from "@/services";
  import type {
    DepartmentSortByOption,
    DepartmentModel,
    DepartmentFilterByOption,
  } from "@/services";
  import { formatDate } from "date-fns";
  import { onMount } from "svelte";
  import { sleep } from "@/utils";
  import SortWorker from "@/web-workers/sort?worker";
  import {
    SessionAlertDialog,
    DeleteRecordDialog,
    DepartmentRecordDialog,
  } from "@/components/dialog";
  import { SortByMenu, FilterByMenu } from "@/components/menu";

  export let data: PageData;

  function onDepartmentSelected(
    id: string,
    value: boolean | "indeterminate"
  ): void {
    if (value) {
      departmentsSelected.add(id);
    } else {
      departmentsSelected.delete(id);
    }

    departmentsSelected = departmentsSelected;
  }

  function onAllDepartmentsSelected(value: boolean | "indeterminate") {
    if (value) {
      departmentsSelected = new Set<string>(departments.map(({ id }) => id));
    } else {
      departmentsSelected = new Set<string>();
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
      type: "DEPARTMENT",
      mode: "REQUEST",
      payload: departments,
      sortOptions: sortBy,
    });
  }

  async function onLoadMore() {
    let itemsRemaining = 0;
    requestOngoing = true;
    await sleep(500);
    try {
      if (departments.length >= currentPage * maxItem) {
        currentPage += 1;
      } else {
        itemsRemaining = maxItem - departments.length;
      }
      await loadData(currentPage, itemsRemaining);
      requestOngoing = false;

      if (sortWorker) {
        sortWorker.postMessage({
          type: "DEPARTMENT",
          mode: "REQUEST",
          payload: departments,
          sortOptions: sortBy,
        });
      }
    } catch (error) {
      sessionAlertDialog.show();
    }
  }

  async function loadData(page: number = 1, itemsRemaining: number = 0) {
    let serviceResponse = await getDepartments({
      accessToken: data.session.accessToken,
      filter: filterBy,
      sort: sortBy,
      count: maxItem,
      page,
    });

    if (serviceResponse.data) {
      departments = [
        ...departments,
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
    departments = [];
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
    showSearchPopover = false;
    await initializeData();
  }

  async function onResetSearch() {
    showSearchPopover = false;
    filterBy = {
      name: String(),
      faculty: String(),
    };
    await initializeData();
  }

  async function onDeleteSuccessful() {
    departmentsSelected = new Set<string>();
    await initializeData();
  }

  const sortOptions = [
    { name: "Name", value: "name" },
    { name: "Faculty", value: "faculty" },
    { name: "Date created", value: "createdAt" },
    { name: "Last modified", value: "updatedAt" },
  ];
  const maxItem = 25;

  let sortBy: DepartmentSortByOption = {
    by: "createdAt",
    ascending: true,
  };
  let filterBy: DepartmentFilterByOption = {
    name: String(),
    faculty: String(),
  };
  let departments: DepartmentModel[] = [];
  let currentPage = 1;
  let requestOngoing = false;
  let initialDataLoaded = false;
  let departmentsSelected = new Set<string>();
  let sortWorker: Worker;
  let sessionAlertDialog: SessionAlertDialog;
  let deleteRecordDialog: DeleteRecordDialog;
  let departmentRecordDialog: DepartmentRecordDialog;
  let showSearchPopover: boolean;

  onMount(async () => {
    sortWorker = new SortWorker();
    sortWorker.addEventListener("message", (e) => {
      const { type, payload, mode } = e.data;
      if (type == "DEPARTMENT" && mode == "RESPONSE") {
        departments = payload;
      }
    });

    await initializeData();
  });
</script>

<div class="flex items-center gap-1 justify-between mb-3">
  <Button
    on:click={() => departmentRecordDialog.show("CREATE", undefined)}
    class="h-9 gap-1.5  {departmentsSelected.size > 0 && 'hidden'}"
  >
    <CirclePlus class="h-3.5 w-3.5" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Add Department
    </span>
  </Button>
  <Button
    variant="destructive"
    on:click={() => deleteRecordDialog.show(Array.from(departmentsSelected))}
    class="h-9 gap-1  {departmentsSelected.size == 0 && 'hidden'}"
  >
    <Trash2 class="h-4 w-4" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Delete {`(${departmentsSelected.size})`}
    </span>
  </Button>
  <div>
    <SortByMenu {sortBy} {sortOptions} {onSortBy} />
    <FilterByMenu
      bind:filterByValue={filterBy}
      description="Find departments with these properties."
      {onSearch}
      {onResetSearch}
    />
  </div>
</div>
<Card.Root>
  <Card.Header class="px-7">
    <Card.Title>Departments</Card.Title>
    <Card.Description>
      {departments.length}
      {departments.length > 1 ? "departments" : "department"} found
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-[35px]">
            <Checkbox
              onCheckedChange={onAllDepartmentsSelected}
              checked={departments.length > 0 &&
                departments.length == departmentsSelected.size}
            />
          </Table.Head>
          <Table.Head class="min-w-[215px] max-w-[215px] truncate">
            Name
          </Table.Head>
          <Table.Head class="min-w-[340px] max-w-[340px]">Levels</Table.Head>
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
        {#each departments as department, _ (department.id)}
          <Table.Row>
            <Table.Cell>
              <Checkbox
                checked={departmentsSelected.has(department.id)}
                onCheckedChange={(value) =>
                  onDepartmentSelected(department.id, value)}
              />
            </Table.Cell>
            <Table.Cell class="min-w-[215px] max-w-[215px] truncate">
              {department.name}
            </Table.Cell>
            <Table.Cell class="min-w-[340px] max-w-[340px]">
              <div class="flex gap-3 justify-start flex-wrap">
                {#each department.levels as level}
                  <Badge variant="secondary">
                    {level.replace("L_", String())}L
                  </Badge>
                {/each}
              </div>
            </Table.Cell>
            <Table.Cell class="min-w-[215px] max-w-[215px] truncate">
              {department.faculty}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(department.createdAt, "yyy-LL-dd")}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(department.updatedAt, "yyy-LL-dd")}
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
                      departmentRecordDialog.show("VIEW", department)}
                    >View</DropdownMenu.Item
                  >
                  <DropdownMenu.Item
                    on:click={() =>
                      departmentRecordDialog.show("UPDATE", department)}
                    >Edit</DropdownMenu.Item
                  >
                  <DropdownMenu.Item
                    on:click={() => deleteRecordDialog.show([department.id])}
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
  {#if departments.length == 0 && initialDataLoaded && !requestOngoing}
    <div
      class="w-full px-7 py-6 pt-0 flex justify-center text-sm text-muted-foreground font-semibold italic"
    >
      No department found
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
<DepartmentRecordDialog
  accessToken={data.session.accessToken}
  on:sessionError={() => sessionAlertDialog.show()}
  on:successful={async () => await initializeData()}
  bind:this={departmentRecordDialog}
/>
<DeleteRecordDialog
  type="DEPARTMENT"
  accessToken={data.session.accessToken}
  on:sessionError={() => sessionAlertDialog.show()}
  on:successful={onDeleteSuccessful}
  bind:this={deleteRecordDialog}
/>
