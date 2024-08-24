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
  import * as DropdownMenu from "@/components/ui/dropdown-menu";
  import * as Table from "@/components/ui/table";
  import { getClassAttendees } from "@/services";
  import type {
    ClassAttendeeSortByOption,
    ClassAttendeeModel,
    ClassAttendeeFilterByOption,
  } from "@/services";
  import { onMount } from "svelte";
  import { sleep } from "@/utils";
  import SortWorker from "@/web-workers/sort?worker";
  import {
    SessionAlertDialog,
    ClassAttendeeDialog,
    DeleteClassAttendanceRecordDialog,
  } from "@/components/dialog";
  import { SortByMenu, FilterByMenu } from "@/components/menu";

  export let data: PageData;

  function onClassAttendeeSelected(
    id: string,
    value: boolean | "indeterminate"
  ): void {
    if (value) {
      classAttendeesSelected.add(id);
    } else {
      classAttendeesSelected.delete(id);
    }

    classAttendeesSelected = classAttendeesSelected;
  }

  function onAllClassAttendeesSelected(value: boolean | "indeterminate") {
    if (value) {
      classAttendeesSelected = new Set<string>(
        classAttendees.map(({ id }) => id)
      );
    } else {
      classAttendeesSelected = new Set<string>();
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
      type: "CLASS_ATTENDEE",
      mode: "REQUEST",
      payload: classAttendees,
      sortOptions: sortBy,
    });
  }

  async function onLoadMore() {
    let itemsRemaining = 0;
    requestOngoing = true;
    await sleep(500);
    try {
      if (classAttendees.length >= currentPage * maxItem) {
        currentPage += 1;
      } else {
        itemsRemaining = maxItem - classAttendees.length;
      }
      await loadData(currentPage, itemsRemaining);
      requestOngoing = false;

      if (sortWorker) {
        sortWorker.postMessage({
          type: "CLASS_ATTENDEE",
          mode: "REQUEST",
          payload: classAttendees,
          sortOptions: sortBy,
        });
      }
    } catch (error) {
      sessionAlertDialog.show();
    }
  }

  async function loadData(page: number = 1, itemsRemaining: number = 0) {
    let serviceResponse = await getClassAttendees({
      classAttendanceId: data.classAttendance.id,
      accessToken: data.session.accessToken,
      filter: filterBy,
      sort: sortBy,
      count: maxItem,
      page,
    });

    if (serviceResponse.data) {
      classAttendees = [
        ...classAttendees,
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
    classAttendees = [];
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
    console.log(filterBy);
    await initializeData();
  }

  async function onResetSearch() {
    filterBy = {
      name: String(),
      regno: String(),
      courseClash: String(),
    };
    await initializeData();
  }

  async function onDeleteSuccessful() {
    classAttendeesSelected = new Set<string>();
    await initializeData();
  }

  const sortOptions = [
    { name: "Name", value: "name" },
    { name: "Regno", value: "regno" },
    { name: "Course crash", value: "courseClash" },
  ];
  const maxItem = 25;

  let sortBy: ClassAttendeeSortByOption = {
    by: "name",
    ascending: true,
  };
  let filterBy: ClassAttendeeFilterByOption = {
    name: String(),
    regno: String(),
    courseClash: String(),
  };
  let filterScheme: { [name: string]: App.FilterByScheme } = {
    courseClash: {
      label: "Course crash",
      type: "text",
    },
  };
  let classAttendees: ClassAttendeeModel[] = [];
  let currentPage = 1;
  let requestOngoing = false;
  let initialDataLoaded = false;
  let classAttendeesSelected = new Set<string>();
  let sortWorker: Worker;
  let sessionAlertDialog: SessionAlertDialog;
  let deleteClassAttendeeRecordDialog: DeleteClassAttendanceRecordDialog;
  let classAttendeeDialog: ClassAttendeeDialog;

  onMount(async () => {
    sortWorker = new SortWorker();
    sortWorker.addEventListener("message", (e) => {
      const { type, payload, mode } = e.data;
      if (type == "CLASS_ATTENDEE" && mode == "RESPONSE") {
        classAttendees = payload;
      }
    });

    await initializeData();
  });
</script>

<div class="flex items-center gap-1 justify-between mb-3">
  <Button
    on:click={() => classAttendeeDialog.show("ADD", undefined)}
    class="h-9 gap-1.5  {classAttendeesSelected.size > 0 && 'hidden'}"
  >
    <CirclePlus class="h-3.5 w-3.5" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Add Class attendee
    </span>
  </Button>
  <Button
    variant="destructive"
    on:click={() =>
      deleteClassAttendeeRecordDialog.show(
        Array.from(classAttendeesSelected),
        data.classAttendance.id
      )}
    class="h-9 gap-1  {classAttendeesSelected.size == 0 && 'hidden'}"
  >
    <Trash2 class="h-4 w-4" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Delete {`(${classAttendeesSelected.size})`}
    </span>
  </Button>
  <div>
    <SortByMenu {sortBy} {sortOptions} {onSortBy} />
    <FilterByMenu
      bind:filterByValue={filterBy}
      filterByScheme={filterScheme}
      description="Find class attendees with these properties."
      {onSearch}
      {onResetSearch}
    />
  </div>
</div>
<Card.Root>
  <Card.Header class="px-7">
    <Card.Title>Class attendees</Card.Title>
    <Card.Description>
      {classAttendees.length}
      {classAttendees.length > 1 ? "Class attendees" : "Class attendee"} found
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-[35px]">
            <Checkbox
              onCheckedChange={onAllClassAttendeesSelected}
              checked={classAttendees.length > 0 &&
                classAttendees.length == classAttendeesSelected.size}
            />
          </Table.Head>
          <Table.Head class="min-w-72 max-w-72 truncate">Name</Table.Head>
          <Table.Head class="min-w-48 max-w-48 truncate">Regno</Table.Head>
          <Table.Head class="min-w-32 max-w-32 truncate">
            Course crash
          </Table.Head>
          <Table.Head class="w-[25px]">
            <div class="w-4"></div>
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body class={initialDataLoaded ? "visible" : "hidden"}>
        {#each classAttendees as classAttendee, _ (classAttendee.id)}
          <Table.Row>
            <Table.Cell>
              <Checkbox
                checked={classAttendeesSelected.has(classAttendee.id)}
                onCheckedChange={(value) =>
                  onClassAttendeeSelected(classAttendee.id, value)}
              />
            </Table.Cell>
            <Table.Cell class="min-w-72 max-w-72 truncate">
              {classAttendee.name}
            </Table.Cell>
            <Table.Cell class="min-w-48 max-w-48 truncate">
              {classAttendee.regno}
            </Table.Cell>
            <Table.Cell class="min-w-28 max-w-28 truncate">
              {#if classAttendee.courseClashCode}
                {classAttendee.courseClashCode}
              {:else}
                -------------
              {/if}
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
                      classAttendeeDialog.show("VIEW", classAttendee)}
                  >
                    View
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    on:click={() =>
                      deleteClassAttendeeRecordDialog.show(
                        [classAttendee.id],
                        data.classAttendance.id
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
  {#if classAttendees.length == 0 && initialDataLoaded && !requestOngoing}
    <div
      class="w-full px-7 py-6 pt-0 flex justify-center text-sm text-muted-foreground font-semibold italic"
    >
      No class attendee found
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
<ClassAttendeeDialog
  accessToken={data.session.accessToken}
  classAttendanceId={data.classAttendance.id}
  on:sessionError={() => sessionAlertDialog.show()}
  on:successful={async () => await initializeData()}
  bind:this={classAttendeeDialog}
/>
<DeleteClassAttendanceRecordDialog
  type="CLASS_ATTENDEE"
  accessToken={data.session.accessToken}
  on:sessionError={() => sessionAlertDialog.show()}
  on:successful={onDeleteSuccessful}
  bind:this={deleteClassAttendeeRecordDialog}
/>
