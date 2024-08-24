<script lang="ts">
  import * as Collapsible from "@/components/ui/collapsible";
  import {
    Home,
    NotebookPen,
    SquareLibrary,
    TableProperties,
    FileSpreadsheet,
    ChevronRight,
    ChevronDown,
  } from "lucide-svelte";
  import { ScrollArea } from "@/components/ui/scroll-area";

  export let isMenuCollapsed: {
    attendances: boolean;
    reports: boolean;
    records: boolean;
  };
  export let currentPage: string;
</script>

<nav class="flex flex-col items-start py-6 font-medium">
  <div class="flex rounded-full w-full flex-col items-center mb-7">
    <a
      href="/app"
      class="flex bg-primary items-center text-background p-1 rounded-lg"
    >
      <NotebookPen size={25} />
    </a>
  </div>
  <ScrollArea class="px-5 w-full max-h-[480px] h-[90%]">
    <a
      href="/app"
      class="flex w-full h-fit items-center gap-x-3.5 transition-colors {currentPage ==
      '/app'
        ? 'text-foreground'
        : 'text-muted-foreground hover:text-foreground'}"
    >
      <Home class="h-5 w-5" />
      <span>Dashboard</span>
    </a>
    <div class="w-full h-4"></div>
    <Collapsible.Root open={isMenuCollapsed.attendances} class="w-full">
      <Collapsible.Trigger
        class="w-full"
        on:click={() =>
          (isMenuCollapsed.attendances = !isMenuCollapsed.attendances)}
      >
        <button
          class="flex w-full h-fit justify-between items-center transition-colors {currentPage.startsWith(
            '/app/attendance'
          )
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'}"
        >
          <div class="flex gap-x-3.5 items-center">
            <TableProperties class="h-5 w-5" />
            <span>Attendance</span>
          </div>
          <ChevronRight
            class="h-5 w-5 {isMenuCollapsed.attendances && 'hidden'}"
          />
          <ChevronDown
            class="h-5 w-5 {!isMenuCollapsed.attendances && 'hidden'}"
          />
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content class="py-1 pl-2 font-normal">
        <a
          href="/app/attendance/register"
          class="flex w-full h-fit pl-6 px-1 border-l items-center transition-colors {currentPage.startsWith(
            '/app/attendance/register'
          )
            ? 'text-primary border-primary'
            : 'text-muted-foreground hover:text-foreground hover:border-foreground'}"
        >
          Registers
        </a>
        <div class="w-full h-2 border-l"></div>
        <a
          href="/app/attendance/class-attendance"
          class="text-base flex w-full h-fit pl-6 px-1 border-l items-center text-muted-foreground transition-colors hover:text-foreground hover:border-foreground {currentPage.startsWith(
            '/app/attendance/class-attendance'
          )
            ? 'text-primary border-primary'
            : 'text-muted-foreground hover:text-foreground hover:border-foreground'}"
        >
          Class attendances
        </a>
      </Collapsible.Content>
    </Collapsible.Root>
    <div class="w-full h-4"></div>
    <Collapsible.Root open={isMenuCollapsed.records} class="w-full">
      <Collapsible.Trigger
        class="w-full"
        on:click={() => (isMenuCollapsed.records = !isMenuCollapsed.records)}
      >
        <button
          class="flex w-full h-fit justify-between items-center transition-colors {currentPage.startsWith(
            '/app/record'
          )
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'}"
        >
          <div class="flex gap-x-3.5 items-center">
            <SquareLibrary class="h-5 w-5" />
            <span>Record</span>
          </div>
          <ChevronRight class="h-5 w-5 {isMenuCollapsed.records && 'hidden'}" />
          <ChevronDown class="h-5 w-5 {!isMenuCollapsed.records && 'hidden'}" />
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content class="py-1 pl-2 font-normal">
        <a
          href="/app/record/faculty"
          class="flex w-full h-fit pl-6 px-1 border-l items-center transition-colors {currentPage.startsWith(
            '/app/record/faculty'
          )
            ? 'text-primary border-primary'
            : 'text-muted-foreground hover:text-foreground hover:border-foreground'}"
        >
          Faculties
        </a>
        <div class="w-full h-2 border-l"></div>
        <a
          href="/app/record/department"
          class="flex w-full h-fit pl-6 px-1 border-l items-center transition-colors {currentPage.startsWith(
            '/app/record/department'
          )
            ? 'text-primary border-primary'
            : 'text-muted-foreground hover:text-foreground hover:border-foreground'}"
        >
          Departments
        </a>
        <div class="w-full h-2 border-l"></div>
        <a
          href="/app/record/course"
          class="flex w-full h-fit pl-6 px-1 border-l items-center transition-colors {currentPage.startsWith(
            '/app/record/course'
          )
            ? 'text-primary border-primary'
            : 'text-muted-foreground hover:text-foreground hover:border-foreground'}"
        >
          Courses
        </a>
        <div class="w-full h-2 border-l"></div>
        <a
          href="/app/record/lecturer"
          class="flex w-full h-fit pl-6 px-1 border-l items-center transition-colors {currentPage.startsWith(
            '/app/record/lecturer'
          )
            ? 'text-primary border-primary'
            : 'text-muted-foreground hover:text-foreground hover:border-foreground'}"
        >
          Lecturers
        </a>
        <div class="w-full h-2 border-l"></div>
        <a
          href="/app/record/student"
          class="flex w-full h-fit pl-6 px-1 border-l items-center transition-colors {currentPage.startsWith(
            '/app/record/student'
          )
            ? 'text-primary border-primary'
            : 'text-muted-foreground hover:text-foreground hover:border-foreground'}"
        >
          Students
        </a>
      </Collapsible.Content>
    </Collapsible.Root>
    <div class="w-full h-4"></div>
    <Collapsible.Root open={isMenuCollapsed.reports} class="w-full">
      <Collapsible.Trigger
        class="w-full"
        on:click={() => (isMenuCollapsed.reports = !isMenuCollapsed.reports)}
      >
        <button
          class="flex w-full h-fit justify-between items-center transition-colors {currentPage.startsWith(
            '/app/report'
          )
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'}"
        >
          <div class="flex gap-x-3.5 items-center">
            <FileSpreadsheet class="h-5 w-5" />
            <span>Report</span>
          </div>
          <ChevronRight class="h-5 w-5 {isMenuCollapsed.reports && 'hidden'}" />
          <ChevronDown class="h-5 w-5 {!isMenuCollapsed.reports && 'hidden'}" />
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content class="py-1 pl-2 font-normal">
        <a
          href="/app/report/course"
          class="flex w-full h-fit pl-6 px-1 border-l items-center transition-colors {currentPage.startsWith(
            '/app/report/course'
          )
            ? 'text-primary border-primary'
            : 'text-muted-foreground hover:text-foreground hover:border-foreground'}"
        >
          Courses
        </a>
        <div class="w-full h-2 border-l"></div>
        <a
          href="/app/report/lecturer"
          class="flex w-full h-fit pl-6 px-1 border-l items-center transition-colors {currentPage.startsWith(
            '/app/report/lecturer'
          )
            ? 'text-primary border-primary'
            : 'text-muted-foreground hover:text-foreground hover:border-foreground'}"
        >
          Lecturers
        </a>
        <div class="w-full h-2 border-l"></div>
        <a
          href="/app/report/student"
          class="flex w-full h-fit pl-6 px-1 border-l items-center transition-colors {currentPage.startsWith(
            '/app/report/student'
          )
            ? 'text-primary border-primary'
            : 'text-muted-foreground hover:text-foreground hover:border-foreground'}"
        >
          Students
        </a>
      </Collapsible.Content>
    </Collapsible.Root>
  </ScrollArea>
</nav>
