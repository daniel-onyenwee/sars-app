<script lang="ts">
  import type { PageData } from "./$types";
  import { Download, Ellipsis, LoaderCircle } from "lucide-svelte/icons";
  import { Button } from "@/components/ui/button";
  import * as Card from "@/components/ui/card";
  import { Skeleton } from "@/components/ui/skeleton";
  import { Badge } from "@/components/ui/badge";
  import * as Table from "@/components/ui/table";
  import * as DropdownMenu from "@/components/ui/dropdown-menu";
  import { generateCourseReport, generateCourseReportBinary } from "@/services";
  import type {
    CourseReportFilterByOption,
    CourseReportSortByOption,
    CourseReportDetail,
    CourseReportMetadata,
  } from "@/services";
  import { CourseReportDialog, SessionAlertDialog } from "@/components/dialog";
  import { onMount } from "svelte";
  import SortWorker from "@/web-workers/sort?worker";
  import { SortByMenu, FilterByMenu } from "@/components/menu";
  import { formatNumber, showToast, sleep } from "@/utils";
  import { formatDate } from "date-fns";

  export let data: PageData;

  async function onDownload() {
    isDownloading = true;
    let fileData = await generateCourseReportBinary({
      filter: filterBy,
      courseId: data.course.id,
      sort: sortBy,
      session: encodeURIComponent(data.academicSession),
    });

    let filename = `${data.course.code}_${data.academicSession}.xlsx`;

    try {
      await window.electron.download(
        filename.replace(/\//g, "-"),
        await fileData.arrayBuffer()
      );
    } catch (error) {
      showToast("ERROR", "Request failed", "Course report download failed");
    }

    isDownloading = false;
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
      type: "COURSE_REPORT",
      mode: "REQUEST",
      payload: reports,
      sortOptions: sortBy,
    });
  }

  async function onLoadMore() {
    let itemsRemaining = 0;
    requestOngoing = true;
    await sleep(500);
    try {
      if (reports.length >= currentPage * maxItem) {
        currentPage += 1;
      } else {
        itemsRemaining = maxItem - reports.length;
      }
      await loadData(currentPage, itemsRemaining);
      requestOngoing = false;

      if (sortWorker) {
        sortWorker.postMessage({
          type: "COURSE_REPORT",
          mode: "REQUEST",
          payload: reports,
          sortOptions: sortBy,
        });
      }
    } catch (error) {
      sessionAlertDialog.show();
    }
  }

  async function loadData(page: number = 1, itemsRemaining: number = 0) {
    let serviceResponse = await generateCourseReport({
      accessToken: data.session.accessToken,
      courseId: data.course.id,
      session: encodeURIComponent(data.academicSession),
      filter: filterBy,
      sort: sortBy,
      count: maxItem,
      page,
    });

    if (serviceResponse.data) {
      reports = [
        ...reports,
        ...serviceResponse.data.report.slice(
          itemsRemaining ? maxItem - itemsRemaining : 0
        ),
      ];
      if (!initialDataLoaded) {
        reportMetadata = serviceResponse.data.metadata;
      }
      return;
    } else {
      throw new Error(JSON.stringify(serviceResponse.error));
    }
  }

  async function initializeData() {
    reports = [];
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

  let sortBy: CourseReportSortByOption = {
    by: "regno",
    ascending: true,
  };
  let filterBy: CourseReportFilterByOption = {
    name: String(),
    regno: String(),
  };
  let reports: CourseReportDetail[] = [];
  let currentPage = 1;
  let requestOngoing = false;
  let reportMetadata: Partial<CourseReportMetadata> = {};
  let initialDataLoaded = false;
  let sortWorker: Worker;
  let sessionAlertDialog: SessionAlertDialog;
  let courseReportDialog: CourseReportDialog;
  let isDownloading: boolean = false;

  onMount(async () => {
    sortWorker = new SortWorker();
    sortWorker.addEventListener("message", (e) => {
      const { type, payload, mode } = e.data;
      if (type == "COURSE_REPORT" && mode == "RESPONSE") {
        reports = payload;
      }
    });

    await initializeData();
  });
</script>

<svelte:head>
  <title>
    {data.course.code} @ {data.academicSession} | Report - SARs
  </title>
</svelte:head>

<Card.Root class="mb-3">
  <Card.Header class="pb-2">
    <Card.Description>Course</Card.Description>
    <Card.Title class="text-4xl">
      {data.course.title}
    </Card.Title>
  </Card.Header>
  <Card.Content>
    <div class="text-muted-foreground">
      {data.course.code} &CenterDot; {data.academicSession}
    </div>
  </Card.Content>
</Card.Root>

<div class="grid gap-3 mb-3 md:mb-8 grid-cols-2">
  {#if initialDataLoaded}
    <Card.Root class="col-span-1">
      <Card.Header class="pb-2">
        <Card.Description>Total classes held</Card.Description>
      </Card.Header>
      <Card.Content>
        <Card.Title class="text-2xl">
          {formatNumber(reportMetadata.totalClasses || 0)}
        </Card.Title>
      </Card.Content>
    </Card.Root>
    <Card.Root class="col-span-1">
      <Card.Header class="pb-2">
        <Card.Description>Total class duration</Card.Description>
      </Card.Header>
      <Card.Content>
        <Card.Title class="text-2xl">
          {formatNumber(reportMetadata.totalClassesInHour || 0)}
          {(reportMetadata.totalClassesInHour || 0) > 1 ? "Hours" : "Hour"}
        </Card.Title>
      </Card.Content>
    </Card.Root>
  {:else}
    {#each { length: 2 } as _, index}
      <Card.Root class="col-span-1">
        <Card.Header class="pb-2">
          <Card.Description>
            {index == 0 ? "Total classes" : "Total duration"}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <Skeleton class="w-full h-6" />
        </Card.Content>
      </Card.Root>
    {/each}
  {/if}
</div>

<div class="flex items-center gap-1 justify-between mb-3">
  <Button disabled={isDownloading} class="h-9 gap-1.5" on:click={onDownload}>
    <LoaderCircle
      class="h-3.5 w-3.5 animate-spin {!isDownloading && 'hidden'}"
    />
    <Download class="h-3.5 w-3.5 {isDownloading && 'hidden'}" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      {!isDownloading ? "Download Report" : "Downloading"}
    </span>
  </Button>
  <div>
    <SortByMenu {sortBy} {sortOptions} {onSortBy} />
    <FilterByMenu
      bind:filterByValue={filterBy}
      description="Find students with these properties."
      {onSearch}
      {onResetSearch}
    />
  </div>
</div>
<Card.Root>
  <Card.Header class="px-7">
    <Card.Title>Student attendances</Card.Title>
    <Card.Description>
      {reports.length}
      {reports.length > 1 ? "students" : "student"} found
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
          {#if initialDataLoaded}
            {#each reportMetadata.classesDate || [] as classAttendance, _ (classAttendance.id)}
              <Table.Head class="min-w-48 text-center">
                {formatDate(classAttendance.date, "do LLL, yyyy")}
                <br />
                {formatDate(classAttendance.startTime, "hh:mm aaa")} - {formatDate(
                  classAttendance.endTime,
                  "hh:mm aaa"
                )}
              </Table.Head>
            {/each}
          {:else}
            {#each { length: 4 } as _}
              <Table.Head class="min-w-48">
                <div class="flex w-full justify-center">
                  <Skeleton class="h-4 w-16" />
                </div>
              </Table.Head>
            {/each}
          {/if}
          <Table.Head class="w-[25px]">
            <div class="w-4"></div>
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body class={initialDataLoaded ? "visible" : "hidden"}>
        {#each reports as report, _ (report.id)}
          <Table.Row>
            <Table.Cell class="min-w-72 max-w-72 truncate">
              {report.name}
            </Table.Cell>
            <Table.Cell class="min-w-48 max-w-48 truncate">
              {report.regno}
            </Table.Cell>
            <Table.Cell class="min-w-36 max-w-36 truncate">
              {report.classesAttended} / {report.numberOfClassTaught}
            </Table.Cell>
            <Table.Cell class="min-w-36 max-w-36 truncate">
              {report.classesAttendedPercentage.toFixed(2)}%
            </Table.Cell>
            <Table.Cell class="min-w-24 max-w-24 truncate capitalize">
              {report.decision.toLowerCase()}
            </Table.Cell>
            {#each reportMetadata.classesDate || [] as classAttendance, _ (classAttendance.id)}
              <Table.Cell class="min-w-48 text-center">
                <Badge
                  class="text-white {report[classAttendance.id] == 1
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'}"
                >
                  {report[classAttendance.id] ? "PRESENT" : "ABSENT"}
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
                      courseReportDialog.show(
                        report,
                        reportMetadata.classesDate || []
                      )}
                  >
                    View
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
              {#each { length: (reportMetadata.classesDate || []).length } as _}
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
            {#each { length: 4 } as _}
              <Table.Cell class="min-w-48">
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
  {#if reports.length == 0 && initialDataLoaded && !requestOngoing}
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
<CourseReportDialog bind:this={courseReportDialog} />
