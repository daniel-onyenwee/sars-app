<script lang="ts">
  import type { PageData } from "./$types";
  import { Button } from "@/components/ui/button";
  import * as Card from "@/components/ui/card";
  import { Skeleton } from "@/components/ui/skeleton";
  import { Badge } from "@/components/ui/badge";
  import * as Table from "@/components/ui/table";
  import { getClassAttendances, statsClassAttendances } from "@/services";
  import type {
    ClassAttendanceSortByOption,
    ClassAttendanceModel,
  } from "@/services";
  import { formatDate } from "date-fns";
  import { onMount } from "svelte";
  import { SessionAlertDialog } from "@/components/dialog";
  import { Progress } from "@/components/ui/progress";
  import numbro from "numbro";
  import { formatNumber, getCurrentSession } from "@/utils";

  export let data: PageData;

  async function loadStats() {
    let classAttendanceCountServiceResponse = await statsClassAttendances({
      accessToken: data.session.accessToken,
    });
    if (!classAttendanceCountServiceResponse.data) {
      return {
        classAttendanceCount: 0,
        todayClassAttendanceCount: 0,
        sessionClassAttendanceCount: 0,
      };
    }

    let todayClassAttendanceCountServiceResponse = await statsClassAttendances({
      accessToken: data.session.accessToken,
      filter: {
        date: new Date().toISOString(),
        session: getCurrentSession(),
      },
    });
    if (!todayClassAttendanceCountServiceResponse.data) {
      return {
        classAttendanceCount: classAttendanceCountServiceResponse.data.count,
        todayClassAttendanceCount: 0,
        sessionClassAttendanceCount: 0,
      };
    }

    let sessionClassAttendanceCountServiceResponse =
      await statsClassAttendances({
        accessToken: data.session.accessToken,
        filter: {
          session: getCurrentSession(),
        },
      });
    if (!sessionClassAttendanceCountServiceResponse.data) {
      return {
        classAttendanceCount: classAttendanceCountServiceResponse.data.count,
        todayClassAttendanceCount:
          todayClassAttendanceCountServiceResponse.data.count,
        sessionClassAttendanceCount: 0,
      };
    }

    return {
      classAttendanceCount: classAttendanceCountServiceResponse.data.count,
      todayClassAttendanceCount:
        todayClassAttendanceCountServiceResponse.data.count,
      sessionClassAttendanceCount:
        sessionClassAttendanceCountServiceResponse.data.count,
    };
  }

  async function loadData() {
    let serviceResponse = await getClassAttendances({
      accessToken: data.session.accessToken,
      sort: sortBy,
      count: 5,
      page: 1,
    });

    if (serviceResponse.data) {
      classAttendances = [...classAttendances, ...serviceResponse.data];
      return;
    } else {
      console.log(serviceResponse.error);
      throw new Error(JSON.stringify(serviceResponse.error));
    }
  }

  async function initializeData() {
    classAttendances = [];
    initialDataLoaded = false;
    try {
      await loadData();
      stats = await loadStats();
      initialDataLoaded = true;
    } catch (error) {
      sessionAlertDialog.show();
    }
  }

  let sortBy: ClassAttendanceSortByOption = {
    by: "createdAt",
    ascending: false,
  };
  let classAttendances: ClassAttendanceModel[] = [];
  let initialDataLoaded = false;
  let stats: {
    classAttendanceCount: number;
    todayClassAttendanceCount: number;
    sessionClassAttendanceCount: number;
  } = {
    classAttendanceCount: 0,
    todayClassAttendanceCount: 0,
    sessionClassAttendanceCount: 0,
  };
  let sessionAlertDialog: SessionAlertDialog;

  onMount(async () => {
    await initializeData();
  });
</script>

<div
  class="grid gap-3 mb-3 md:mb-8 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3"
>
  <Card.Root class="col-span-1 md:col-span-2 xl:col-span-1">
    <Card.Header class="pb-2">
      <Card.Title>Welcome Back</Card.Title>
      <Card.Description class="max-w-lg text-balance leading-relaxed">
        Good morning admin, already for a seamless experience
      </Card.Description>
    </Card.Header>
    <Card.Footer>
      <Button href="/app/attendance/class-attendance?create">
        Create Class attendance
      </Button>
    </Card.Footer>
  </Card.Root>
  {#if initialDataLoaded}
    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Description>Total class attendances</Card.Description>
        <Card.Title class="text-4xl">
          {formatNumber(stats.sessionClassAttendanceCount)}
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-muted-foreground text-xs">
          For {getCurrentSession()} session
        </div>
      </Card.Content>
      <Card.Footer>
        <Progress
          value={(stats.sessionClassAttendanceCount /
            (stats.classAttendanceCount || 1)) *
            100}
        />
      </Card.Footer>
    </Card.Root>
    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Description>Today class attendance</Card.Description>
        <Card.Title class="text-4xl">
          {formatNumber(stats.todayClassAttendanceCount)}
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-muted-foreground text-xs">
          {numbro(
            stats.todayClassAttendanceCount /
              (stats.sessionClassAttendanceCount || 1)
          ).format({ output: "percent", mantissa: 2 })} of {getCurrentSession()}
          class attendances
        </div>
      </Card.Content>
      <Card.Footer>
        <Progress
          value={(stats.sessionClassAttendanceCount /
            (stats.todayClassAttendanceCount || 1)) *
            100}
        />
      </Card.Footer>
    </Card.Root>
  {:else}
    {#each { length: 2 } as _, index}
      <Card.Root>
        <Card.Header class="pb-2">
          <Card.Description>
            {index == 0
              ? "Total class attendances"
              : "Ongoing class attendances"}
          </Card.Description>
          <Card.Title class="text-4xl">
            <Skeleton class="w-full h-9" />
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="text-muted-foreground text-xs">
            <Skeleton class="w-full h-4" />
          </div>
        </Card.Content>
        <Card.Footer>
          <Progress value={0} />
        </Card.Footer>
      </Card.Root>
    {/each}
  {/if}
</div>
<Card.Root>
  <Card.Header class="px-7">
    <Card.Title>Class attendances</Card.Title>
    <Card.Description>Recent class attendances</Card.Description>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="min-w-72 max-w-72 truncate">
            Course title
          </Table.Head>
          <Table.Head class="min-w-28 max-w-28 truncate">
            Course code
          </Table.Head>
          <Table.Head class="min-w-72 max-w-72 truncate">
            Lecturer name
          </Table.Head>
          <Table.Head class="min-w-[115px]">Date</Table.Head>
          <Table.Head class="min-w-28">Start time</Table.Head>
          <Table.Head class="min-w-28">End time</Table.Head>
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
        </Table.Row>
      </Table.Header>
      <Table.Body class={initialDataLoaded ? "visible" : "hidden"}>
        {#each classAttendances as classAttendance, _ (classAttendance.id)}
          <Table.Row>
            <Table.Cell class="min-w-72 max-w-72 truncate">
              {classAttendance.courseTitle}
            </Table.Cell>
            <Table.Cell class="min-w-28 max-w-28 truncate">
              {classAttendance.courseCode}
            </Table.Cell>
            <Table.Cell class="min-w-72 max-w-72 truncate">
              {classAttendance.lecturerName}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(classAttendance.date, "yyy-LL-dd")}
            </Table.Cell>
            <Table.Cell class="min-w-28">
              {formatDate(classAttendance.startTime, "hh:mm aaa")}
            </Table.Cell>
            <Table.Cell class="min-w-28">
              {formatDate(classAttendance.endTime, "hh:mm aaa")}
            </Table.Cell>

            <Table.Cell class="min-w-28 max-w-28 truncate">
              <Badge variant="default">
                {classAttendance.semester}
              </Badge>
            </Table.Cell>
            <Table.Cell class="min-w-24 max-w-24 truncate">
              <Badge variant="outline">
                {classAttendance.level.replace("L_", String())}L
              </Badge>
            </Table.Cell>
            <Table.Cell class="min-w-28 max-w-28 truncate">
              {classAttendance.session}
            </Table.Cell>
            <Table.Cell class="min-w-[215px] max-w-[215px] truncate">
              {classAttendance.department}
            </Table.Cell>
            <Table.Cell class="min-w-[215px] max-w-[215px] truncate">
              {classAttendance.faculty}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(classAttendance.createdAt, "yyy-LL-dd")}
            </Table.Cell>

            <Table.Cell class="min-w-[115px]">
              {formatDate(classAttendance.updatedAt, "yyy-LL-dd")}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
      <Table.Body class={!initialDataLoaded ? "visible" : "hidden"}>
        {#each { length: 3 } as _}
          <Table.Row>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Card.Content>
  {#if classAttendances.length == 0 && initialDataLoaded}
    <div
      class="w-full px-7 py-6 pt-0 flex justify-center text-sm text-muted-foreground font-semibold italic"
    >
      No class attendance found
    </div>
  {/if}
  <Card.Footer class="justify-center border-t p-4">
    <Skeleton class="h-7 w-[92px] {initialDataLoaded && 'hidden'}" />
    <Button
      size="sm"
      variant="ghost"
      href="/app/attendance/class-attendance"
      class="gap-1 {!initialDataLoaded && 'hidden'}"
    >
      See more
    </Button>
  </Card.Footer>
</Card.Root>

<SessionAlertDialog bind:this={sessionAlertDialog} />
