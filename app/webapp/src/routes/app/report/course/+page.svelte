<script lang="ts">
  import type { PageData } from "./$types";
  import * as Card from "@/components/ui/card";
  import * as Command from "@/components/ui/command";
  import * as Popover from "@/components/ui/popover";
  import { Label } from "@/components/ui/label";
  import { Button } from "@/components/ui/button";
  import { Check, ChevronsUpDown, LoaderCircle } from "lucide-svelte/icons";
  import { cn } from "@/utils";
  import type { CourseModel } from "@/services";
  import { tick } from "svelte";
  import { goto } from "$app/navigation";

  interface ReportDetail {
    courseId: string;
    courseTitle: string;
    session: string;
    courseCode: string;
  }

  async function onContinue() {
    requestOngoing = true;

    errorMessage = {};

    let formInputs = ["courseCode", "session"];

    for (const key of formInputs) {
      if (!Object(reportDetail)[key]) {
        Object(errorMessage)[key] = "Field required";
        requestOngoing = false;
        return;
      }
    }

    requestOngoing = true;

    await goto(
      `./course/${reportDetail.courseId}/${encodeURIComponent(reportDetail.session || String())}`
    );
  }

  function onSessionSelected(session: string) {
    reportDetail.session = session;
    sessionPopoverOpen = false;
  }

  function onCourseSelected(course: CourseModel) {
    reportDetail.courseId = course.id;
    reportDetail.courseTitle = course.title;
    reportDetail.courseCode = course.code;
    coursePopoverOpen = false;
  }

  function closeAndFocusTrigger(triggerId: string) {
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }

  export let data: PageData;
  let coursePopoverOpen = false;
  let sessionPopoverOpen = false;
  let requestOngoing: boolean = false;
  let reportDetail: Partial<ReportDetail> = {};
  let errorMessage: Partial<Record<keyof ReportDetail, string>> = {};
</script>

<main
  class="flex justify-center items-center fixed w-full h-full top-0 left-0 pl-0 sm:pl-[250px] sm:pt-16"
>
  <Card.Root class="w-[350px] mx-auto max-w-sm">
    <Card.Header>
      <Card.Title class="text-2xl">Course report</Card.Title>
      <Card.Description>
        Instant report generation with one-click.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form class="grid w-full items-center gap-4">
        <div class="flex flex-col space-y-1.5">
          <Label
            class={errorMessage.courseCode && "text-red-500"}
            for="session"
          >
            Course
          </Label>
          <Popover.Root bind:open={coursePopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={coursePopoverOpen}
                class="w-full h-fit justify-between font-normal {reportDetail.courseCode ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if reportDetail.courseCode}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {reportDetail.courseTitle}
                    </p>
                    <p class="text-sm text-muted-foreground truncate text-left">
                      {reportDetail.courseCode}
                    </p>
                  </div>
                {:else}
                  Select course
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0 w-[300px]">
              <Command.Root loop>
                <Command.Input placeholder="Search course..." />
                <Command.List>
                  <Command.Empty>No course found.</Command.Empty>
                  <Command.Group class="overflow-auto max-h-44">
                    {#each data.courses as course}
                      <Command.Item
                        onSelect={() => {
                          onCourseSelected(course);
                          closeAndFocusTrigger(ids.trigger);
                        }}
                        value={`${course.code} ${course.title}`}
                      >
                        <Check
                          class={cn(
                            "mr-2 h-4 w-4",
                            course.code !== reportDetail.courseCode &&
                              "text-transparent"
                          )}
                        />
                        <div
                          style="width: calc(100% - 20px)"
                          class="grid gap-1"
                        >
                          <span>{course.title}</span>
                          <span class="text-sm text-muted-foreground">
                            {course.code}
                          </span>
                        </div>
                      </Command.Item>
                    {/each}
                  </Command.Group>
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.courseCode &&
              'hidden'}"
          >
            {errorMessage.courseCode}
          </p>
        </div>
        <div class="flex flex-col space-y-1.5">
          <Label class={errorMessage.session && "text-red-500"} for="session">
            Session
          </Label>
          <Popover.Root bind:open={sessionPopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={sessionPopoverOpen}
                class="w-full h-fit justify-between font-normal {reportDetail.session ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if reportDetail.session}
                  {reportDetail.session}
                {:else}
                  Select session
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0 w-[300px]">
              <Command.Root loop>
                <Command.Input placeholder="Search session..." />
                <Command.List>
                  <Command.Empty>No session found.</Command.Empty>
                  <Command.Group class="overflow-auto max-h-44">
                    {#each { length: 5 } as _, i}
                      <Command.Item
                        onSelect={(currentValue) => {
                          onSessionSelected(currentValue);
                          closeAndFocusTrigger(ids.trigger);
                        }}
                        value={`${new Date().getFullYear() - 5 + i}/${new Date().getFullYear() - 4 + i}`}
                      >
                        <Check
                          class={cn(
                            "mr-2 h-4 w-4",
                            reportDetail.session !==
                              `${new Date().getFullYear() - 5 + i}/${new Date().getFullYear() - 4 + i}` &&
                              "text-transparent"
                          )}
                        />
                        {`${new Date().getFullYear() - 5 + i}/${new Date().getFullYear() - 4 + i}`}
                      </Command.Item>
                    {/each}
                    {#each { length: 5 } as _, i}
                      <Command.Item
                        onSelect={(currentValue) => {
                          onSessionSelected(currentValue);
                          closeAndFocusTrigger(ids.trigger);
                        }}
                        value={`${new Date().getFullYear() + i}/${new Date().getFullYear() + (i + 1)}`}
                      >
                        <Check
                          class={cn(
                            "mr-2 h-4 w-4",
                            reportDetail.session !==
                              `${new Date().getFullYear() + i}/${new Date().getFullYear() + (i + 1)}` &&
                              "text-transparent"
                          )}
                        />
                        {`${new Date().getFullYear() + i}/${new Date().getFullYear() + (i + 1)}`}
                      </Command.Item>
                    {/each}
                  </Command.Group>
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>

          <p
            class="text-sm font-medium text-red-500 {!errorMessage.session &&
              'hidden'}"
          >
            {errorMessage.session}
          </p>
        </div>
      </form>
    </Card.Content>
    <Card.Footer>
      <Button disabled={requestOngoing} class="w-full" on:click={onContinue}>
        <LoaderCircle
          class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
        />
        {!requestOngoing ? "Generate" : "Please wait"}
      </Button>
    </Card.Footer>
  </Card.Root>
</main>
