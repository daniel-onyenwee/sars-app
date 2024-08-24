<script lang="ts">
  import * as Sheet from "@/components/ui/sheet";
  import type { LecturerReportDetail } from "@/services";
  import { Label } from "@/components/ui/label";

  export function show(data: LecturerReportDetail) {
    studentReportDetail = data;
    open = true;
  }

  export function close() {
    internalClose();
    open = false;
  }

  function internalClose() {
    studentReportDetail = {};
  }

  let open = false;
  let studentReportDetail: Partial<LecturerReportDetail> = {};
  let dialogTitle = "Course taught details";
  let dialogDescription = "Complete information about the course taught.";
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
        <Label>Course title</Label>
        <span
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {studentReportDetail.courseTitle}
        </span>
      </div>
      <div class="grid gap-2">
        <Label>Course code</Label>
        <span
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {studentReportDetail.courseCode}
        </span>
      </div>

      <div class="grid gap-2">
        <Label>Semester</Label>
        <span
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {studentReportDetail.semester}
        </span>
      </div>
      <div class="grid gap-2">
        <Label for="classes-taught">Classes taught</Label>
        <span
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          id="classes-taught"
        >
          {studentReportDetail.classesTaught} / {studentReportDetail.totalClasses}
        </span>
      </div>
      <div class="grid gap-2">
        <Label for="classes-taught-in-hours">Classes taught in hours</Label>
        <span
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          id="classes-taught-in-hours"
        >
          {studentReportDetail.classesTaughtInHour} of {studentReportDetail.totalClassesInHour}
        </span>
      </div>
      <div class="grid gap-2">
        <Label for="classes-taught-percentage">Classes taught percentage</Label>
        <span
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          id="classes-taught-percentage"
        >
          {studentReportDetail.classesTaughtPercentage?.toFixed(2)}%
        </span>
      </div>
    </div>
  </Sheet.Content>
</Sheet.Root>
