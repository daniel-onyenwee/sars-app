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
  import { getStudents } from "@/services";
  import type {
    StudentSortByOption,
    StudentModel,
    StudentFilterByOption,
  } from "@/services";
  import { formatDate } from "date-fns";
  import { onMount } from "svelte";
  import { sleep } from "@/utils";
  import SortWorker from "@/web-workers/sort?worker";
  import {
    SessionAlertDialog,
    DeleteRecordDialog,
    StudentRecordDialog,
  } from "@/components/dialog";
  import { SortByMenu, FilterByMenu } from "@/components/menu";

  export let data: PageData;

  function onStudentSelected(
    id: string,
    value: boolean | "indeterminate"
  ): void {
    if (value) {
      studentsSelected.add(id);
    } else {
      studentsSelected.delete(id);
    }

    studentsSelected = studentsSelected;
  }

  function onAllStudentsSelected(value: boolean | "indeterminate") {
    if (value) {
      studentsSelected = new Set<string>(students.map(({ id }) => id));
    } else {
      studentsSelected = new Set<string>();
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
      type: "STUDENT",
      mode: "REQUEST",
      payload: students,
      sortOptions: sortBy,
    });
  }

  async function onLoadMore() {
    let itemsRemaining = 0;
    requestOngoing = true;
    await sleep(500);
    try {
      if (students.length >= currentPage * maxItem) {
        currentPage += 1;
      } else {
        itemsRemaining = maxItem - students.length;
      }
      await loadData(currentPage, itemsRemaining);
      requestOngoing = false;

      if (sortWorker) {
        sortWorker.postMessage({
          type: "STUDENT",
          mode: "REQUEST",
          payload: students,
          sortOptions: sortBy,
        });
      }
    } catch (error) {
      sessionAlertDialog.show();
    }
  }

  async function loadData(page: number = 1, itemsRemaining: number = 0) {
    let serviceResponse = await getStudents({
      accessToken: data.session.accessToken,
      filter: filterBy,
      sort: sortBy,
      count: maxItem,
      page,
    });

    if (serviceResponse.data) {
      students = [
        ...students,
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
    students = [];
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
      gender: String(),
      level: String(),
      department: String(),
      faculty: String(),
    };
    await initializeData();
  }

  async function onDeleteSuccessful() {
    studentsSelected = new Set<string>();
    await initializeData();
  }

  const sortOptions = [
    { name: "Name", value: "name" },
    { name: "Regno", value: "regno" },
    { name: "Level", value: "level" },
    { name: "Gender", value: "gender" },
    { name: "Department", value: "department" },
    { name: "Faculty", value: "faculty" },
    { name: "Date created", value: "createdAt" },
    { name: "Last modified", value: "updatedAt" },
  ];
  const maxItem = 25;

  let sortBy: StudentSortByOption = {
    by: "createdAt",
    ascending: true,
  };
  let filterBy: StudentFilterByOption = {
    name: String(),
    regno: String(),
    gender: String(),
    level: String(),
    department: String(),
    faculty: String(),
  };
  let filterScheme: { [name: string]: App.FilterByScheme } = {
    gender: {
      type: "select",
      options: ["MALE", "FEMALE"],
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
  let students: StudentModel[] = [];
  let currentPage = 1;
  let requestOngoing = false;
  let initialDataLoaded = false;
  let studentsSelected = new Set<string>();
  let sortWorker: Worker;
  let sessionAlertDialog: SessionAlertDialog;
  let deleteRecordDialog: DeleteRecordDialog;
  let studentRecordDialog: StudentRecordDialog;

  onMount(async () => {
    sortWorker = new SortWorker();
    sortWorker.addEventListener("message", (e) => {
      const { type, payload, mode } = e.data;
      if (type == "STUDENT" && mode == "RESPONSE") {
        students = payload;
      }
    });

    await initializeData();
  });
</script>

<div class="flex items-center gap-1 justify-between mb-3">
  <Button
    on:click={() => studentRecordDialog.show("CREATE", undefined)}
    class="h-9 gap-1.5  {studentsSelected.size > 0 && 'hidden'}"
  >
    <CirclePlus class="h-3.5 w-3.5" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Add Student
    </span>
  </Button>
  <Button
    variant="destructive"
    on:click={() => deleteRecordDialog.show(Array.from(studentsSelected))}
    class="h-9 gap-1  {studentsSelected.size == 0 && 'hidden'}"
  >
    <Trash2 class="h-4 w-4" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Delete {`(${studentsSelected.size})`}
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
    <Card.Title>Student</Card.Title>
    <Card.Description>
      {students.length}
      {students.length > 1 ? "students" : "student"} found
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-[35px]">
            <Checkbox
              onCheckedChange={onAllStudentsSelected}
              checked={students.length > 0 &&
                students.length == studentsSelected.size}
            />
          </Table.Head>
          <Table.Head class="min-w-72 max-w-72 truncate">Name</Table.Head>
          <Table.Head class="min-w-48 max-w-48 truncate">Regno</Table.Head>
          <Table.Head class="min-w-24">Level</Table.Head>
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
        {#each students as student, _ (student.id)}
          <Table.Row>
            <Table.Cell>
              <Checkbox
                checked={studentsSelected.has(student.id)}
                onCheckedChange={(value) =>
                  onStudentSelected(student.id, value)}
              />
            </Table.Cell>
            <Table.Cell class="min-w-72 max-w-72 truncate">
              {student.name}
            </Table.Cell>
            <Table.Cell class="min-w-48 max-w-48 truncate">
              {student.regno}
            </Table.Cell>
            <Table.Cell class="min-w-24">
              <Badge variant="outline">
                {student.level.replace("L_", String())}L
              </Badge>
            </Table.Cell>
            <Table.Cell class="min-w-28">
              <Badge variant="default">
                {student.gender}
              </Badge>
            </Table.Cell>
            <Table.Cell class="min-w-[215px] max-w-[215px] truncate">
              {student.department}
            </Table.Cell>
            <Table.Cell class="min-w-[215px] max-w-[215px] truncate">
              {student.faculty}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(student.createdAt, "yyy-LL-dd")}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(student.updatedAt, "yyy-LL-dd")}
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
                    on:click={() => studentRecordDialog.show("VIEW", student)}
                    >View</DropdownMenu.Item
                  >
                  <DropdownMenu.Item
                    on:click={() => studentRecordDialog.show("UPDATE", student)}
                    >Edit</DropdownMenu.Item
                  >
                  <DropdownMenu.Item
                    on:click={() => deleteRecordDialog.show([student.id])}
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
  {#if students.length == 0 && initialDataLoaded && !requestOngoing}
    <div
      class="w-full px-7 py-6 pt-0 flex justify-center text-sm text-muted-foreground font-semibold italic"
    >
      No student found
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
<StudentRecordDialog
  accessToken={data.session.accessToken}
  on:sessionError={() => sessionAlertDialog.show()}
  on:successful={async () => await initializeData()}
  bind:this={studentRecordDialog}
/>
<DeleteRecordDialog
  type="STUDENT"
  accessToken={data.session.accessToken}
  on:sessionError={() => sessionAlertDialog.show()}
  on:successful={onDeleteSuccessful}
  bind:this={deleteRecordDialog}
/>
