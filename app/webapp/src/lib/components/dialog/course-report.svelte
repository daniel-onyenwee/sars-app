<script lang="ts">
  import * as Sheet from "@/components/ui/sheet";
  import type { CourseReportDetail, IClassAttendance } from "@/services";
  import { Label } from "@/components/ui/label";
  import { formatDate } from "date-fns";

  export function show(
    data: CourseReportDetail,
    classAttendances: IClassAttendance[]
  ) {
    courseReportDetail = data;
    _classAttendances = classAttendances;
    open = true;
  }

  export function close() {
    internalClose();
    open = false;
  }

  function internalClose() {
    courseReportDetail = {};
  }

  let open = false;
  let courseReportDetail: Partial<CourseReportDetail> = {};
  let dialogTitle = "Student attendance details";
  let dialogDescription = "Complete information about the Student attendance.";
  let _classAttendances: IClassAttendance[] = [];
</script>

<Sheet.Root
  bind:open
  onOpenChange={(open) => {
    if (!open) {
      internalClose();
    }
  }}
>
  <Sheet.Content side="right" class="overflow-auto">
    <Sheet.Header>
      <Sheet.Title>{dialogTitle}</Sheet.Title>
      <Sheet.Description>{dialogDescription}</Sheet.Description>
    </Sheet.Header>
    <div class="grid items-start gap-4 mt-4">
      <div class="grid gap-2">
        <Label>Surname</Label>
        <span
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {courseReportDetail.surname}
        </span>
      </div>
      <div class="grid gap-2">
        <Label>Other names</Label>
        <span
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {courseReportDetail.otherNames}
        </span>
      </div>
      <div class="grid gap-2">
        <Label>Regno</Label>
        <span
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {courseReportDetail.regno}
        </span>
      </div>
      <div class="grid gap-2">
        <Label for="classes-attended">Classes attended</Label>
        <span
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          id="classes-attended"
        >
          {courseReportDetail.classesAttended} / {courseReportDetail.numberOfClassTaught}
        </span>
      </div>
      <div class="grid gap-2">
        <Label for="classes-attended-percentage">
          Classes attended percentage
        </Label>
        <span
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          id="classes-attended-percentage"
        >
          {courseReportDetail.classesAttendedPercentage?.toFixed(2)}%
        </span>
      </div>
      <div class="grid gap-2">
        <Label for="decision">Decision</Label>
        <span
          class="flex h-10 w-full capitalize rounded-md border border-input bg-background px-3 py-2 text-sm"
          id="decision"
        >
          {courseReportDetail.decision?.toLowerCase()}
        </span>
      </div>
      {#each _classAttendances as classAttendance}
        <div class="grid gap-2">
          <Label>
            {formatDate(classAttendance.date, "do LLL, yyyy")} /
            {formatDate(classAttendance.startTime, "hh:mm aaa")} -
            {formatDate(classAttendance.endTime, "hh:mm aaa")}
          </Label>
          <span
            class="flex h-10 w-full capitalize rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {courseReportDetail[classAttendance.id] == 1 ? "Present" : "Absent"}
          </span>
        </div>
      {/each}
    </div>
  </Sheet.Content>
</Sheet.Root>
