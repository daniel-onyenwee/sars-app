<script lang="ts">
  import * as Sheet from "@/components/ui/sheet";
  import type { StudentReportDetail } from "@/services";
  import { Label } from "@/components/ui/label";

  export function show(data: StudentReportDetail) {
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
  let studentReportDetail: Partial<StudentReportDetail> = {};
  let dialogTitle = "Course offered details";
  let dialogDescription = "Complete information about the course offered.";
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
        <Label for="classes-attended">Classes attended</Label>
        <span
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          id="classes-attended"
        >
          {studentReportDetail.classesAttended} / {studentReportDetail.totalClasses}
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
          {studentReportDetail.classesAttendedPercentage?.toFixed(2)}%
        </span>
      </div>
    </div>
  </Sheet.Content>
</Sheet.Root>
