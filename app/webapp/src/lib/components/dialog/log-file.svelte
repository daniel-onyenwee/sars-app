<script lang="ts">
  import { mediaQuery } from "svelte-legos";
  import { LoaderCircle } from "lucide-svelte/icons";
  import { capitalizeText, showToast } from "@/utils";
  import * as Dialog from "@/components/ui/dialog";
  import * as Drawer from "@/components/ui/drawer";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher } from "svelte";

  export let action: "IMPORT" | "EXPORT";

  export function show(path: string) {
    if (!path) return;

    logFilePath = path;
    open = true;
  }

  export function close() {
    internalClose();
    open = false;
  }

  function internalClose() {
    logFilePath = null;
  }

  async function onLogAction() {
    if (!logFilePath) return;

    requestOngoing = true;

    try {
      if (action == "EXPORT") {
        await window.electron.engine.log.output(logFilePath);
      } else if (action == "IMPORT") {
        await window.electron.engine.log.apply(logFilePath);
      }

      showToast(
        "SUCCESS",
        "Request successful",
        `Log file successfully ${action.toLowerCase()}`
      );
      if (action == "IMPORT") {
        window.location.reload();
      }
    } catch (error: any) {
      let [_, errorMessage] = error.message.split("Error:");
      showToast(
        "ERROR",
        "Request failed",
        capitalizeText(errorMessage.trim(), true)
      );
    }

    requestOngoing = false;
    close();
  }

  let requestOngoing: boolean = false;
  let open = false;
  let isDesktop = mediaQuery("(min-width: 768px)");
  let logFilePath: string | null = null;
  let dialogDescription =
    action == "EXPORT"
      ? "Exporting your application log file will expose sensitive information. Ensure the recipient is trusted."
      : "Importing this log file will modify your application data. Ensure that the log file is trustworthy.";
</script>

{#if $isDesktop}
  <Dialog.Root
    closeOnEscape={!requestOngoing}
    closeOnOutsideClick={!requestOngoing}
    onOpenChange={(open) => {
      if (!open) {
        internalClose();
      }
    }}
    bind:open
  >
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header>
        <Dialog.Title
          >{capitalizeText(action.toLowerCase())} Log File</Dialog.Title
        >
        <Dialog.Description>
          {dialogDescription}
        </Dialog.Description>
      </Dialog.Header>
      <div class="grid items-start gap-4">
        <Button on:click={onLogAction} disabled={requestOngoing}>
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing
            ? capitalizeText(action.toLowerCase())
            : "Please wait"}
        </Button>
      </div>
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Drawer.Root
    closeOnEscape={!requestOngoing}
    closeOnOutsideClick={!requestOngoing}
    onOpenChange={(open) => {
      if (!open) {
        internalClose();
      }
    }}
    bind:open
  >
    <Drawer.Content>
      <Drawer.Header class="text-left">
        <Drawer.Title
          >{capitalizeText(action.toLowerCase())} Log File</Drawer.Title
        >
        <Drawer.Description>
          {dialogDescription}
        </Drawer.Description>
      </Drawer.Header>
      <Drawer.Footer class="pt-2">
        <Button on:click={onLogAction} disabled={requestOngoing}>
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing
            ? capitalizeText(action.toLowerCase())
            : "Please wait"}
        </Button>
        <Drawer.Close disabled={requestOngoing} asChild let:builder>
          <Button variant="outline" builders={[builder]}>Cancel</Button>
        </Drawer.Close>
      </Drawer.Footer>
    </Drawer.Content>
  </Drawer.Root>
{/if}
