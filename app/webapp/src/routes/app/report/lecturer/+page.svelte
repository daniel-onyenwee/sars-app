<script lang="ts">
  import type { PageData } from "./$types";
  import * as Card from "@/components/ui/card";
  import * as Command from "@/components/ui/command";
  import * as Popover from "@/components/ui/popover";
  import { Label } from "@/components/ui/label";
  import { Button } from "@/components/ui/button";
  import { Check, ChevronsUpDown, LoaderCircle } from "lucide-svelte/icons";
  import { cn } from "@/utils";
  import type { LecturerModel } from "@/services";
  import { tick } from "svelte";
  import { goto } from "$app/navigation";

  interface ReportDetail {
    lecturerId: string;
    lecturerName: string;
    session: string;
    lecturerUsername: string;
  }

  async function onContinue() {
    requestOngoing = true;

    errorMessage = {};

    let formInputs = ["lecturerUsername", "session"];

    for (const key of formInputs) {
      if (!Object(reportDetail)[key]) {
        Object(errorMessage)[key] = "Field required";
        requestOngoing = false;
        return;
      }
    }

    requestOngoing = true;

    await goto(
      `./lecturer/${reportDetail.lecturerId}/${encodeURIComponent(reportDetail.session || String())}`
    );
  }

  function onSessionSelected(session: string) {
    reportDetail.session = session;
    sessionPopoverOpen = false;
  }

  function onLecturerSelected(lecturer: LecturerModel) {
    reportDetail.lecturerId = lecturer.id;
    reportDetail.lecturerName = lecturer.name;
    reportDetail.lecturerUsername = lecturer.username;
    lecturerPopoverOpen = false;
  }

  function closeAndFocusTrigger(triggerId: string) {
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }

  export let data: PageData;
  let lecturerPopoverOpen = false;
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
      <Card.Title class="text-2xl">Lecturer report</Card.Title>
      <Card.Description>
        Instant report generation with one-click.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form class="grid w-full items-center gap-4">
        <div class="flex flex-col space-y-1.5">
          <Label
            class={errorMessage.lecturerUsername && "text-red-500"}
            for="session"
          >
            Lecturer
          </Label>
          <Popover.Root bind:open={lecturerPopoverOpen} let:ids>
            <Popover.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={lecturerPopoverOpen}
                class="w-full h-fit justify-between font-normal {reportDetail.lecturerUsername ==
                  undefined && 'text-muted-foreground'}"
              >
                {#if reportDetail.lecturerUsername}
                  <div class="grid gap-1" style="width: calc(100% - 20px)">
                    <p class="truncate text-left">
                      {reportDetail.lecturerName}
                    </p>
                    <p class="text-sm text-muted-foreground truncate text-left">
                      {reportDetail.lecturerUsername}
                    </p>
                  </div>
                {:else}
                  Select lecturer
                {/if}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="p-0 w-[300px]">
              <Command.Root loop>
                <Command.Input placeholder="Search lecturer..." />
                <Command.List>
                  <Command.Empty>No lecturer found.</Command.Empty>
                  <Command.Group class="overflow-auto max-h-44">
                    {#each data.lecturers as lecturer}
                      <Command.Item
                        onSelect={() => {
                          onLecturerSelected(lecturer);
                          closeAndFocusTrigger(ids.trigger);
                        }}
                        value={`${lecturer.username} ${lecturer.name}`}
                      >
                        <Check
                          class={cn(
                            "mr-2 h-4 w-4",
                            lecturer.username !==
                              reportDetail.lecturerUsername &&
                              "text-transparent"
                          )}
                        />
                        <div
                          style="width: calc(100% - 20px)"
                          class="grid gap-1"
                        >
                          <span>{lecturer.name}</span>
                          <span class="text-sm text-muted-foreground">
                            {lecturer.username}
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
            class="text-sm font-medium text-red-500 {!errorMessage.lecturerUsername &&
              'hidden'}"
          >
            {errorMessage.lecturerUsername}
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
