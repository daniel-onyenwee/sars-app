<script lang="ts">
  import { LoaderCircle } from "lucide-svelte/icons";
  import { showToast } from "@/utils";
  import * as Sheet from "@/components/ui/sheet";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { createEventDispatcher } from "svelte";

  export function show() {
    open = true;
  }

  export function close() {
    internalClose();
    open = false;
  }

  function internalClose() {
    errorMessage = {};
    data = {};
  }

  async function onSave() {
    requestOngoing = true;

    errorMessage = {};

    if (!data.password) {
      errorMessage.password = "Required field";
      requestOngoing = false;
      return;
    }

    if (!data.newPassword) {
      errorMessage.newPassword = "Required field";
      requestOngoing = false;
      return;
    }

    try {
      if (
        data.password != (await window.electron.engine.config("admin.password"))
      ) {
        errorMessage.password = "Incorrect password";
        requestOngoing = false;
        return;
      }

      await window.electron.engine.config("admin.password", data.newPassword);

      showToast(
        "SUCCESS",
        "Request successful",
        "Change password successfully"
      );
    } catch (error) {
      showToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  let requestOngoing: boolean = false;
  let dispatch = createEventDispatcher();
  let data: Partial<Record<"password" | "newPassword", string>> = {};
  let errorMessage: typeof data = {};
  let open: boolean = false;
</script>

<Sheet.Root
  closeOnEscape={!requestOngoing}
  closeOnOutsideClick={!requestOngoing}
  bind:open
  onOpenChange={(open) => {
    if (!open) {
      internalClose();
    }
  }}
>
  <Sheet.Content side="right" class="overflow-auto">
    <Sheet.Header>
      <Sheet.Title>Change Password</Sheet.Title>
      <Sheet.Description>
        Change to your account password here. Click change when you're done.
      </Sheet.Description>
    </Sheet.Header>
    <form class="grid items-start gap-4 mt-4">
      <div class="grid gap-2">
        <Label for="password">Password</Label>
        <Input type="password" id="password" bind:value={data.password} />
        <p
          class="text-sm font-medium text-red-500 {!errorMessage.password &&
            'hidden'}"
        >
          {errorMessage.password}
        </p>
      </div>
      <div class="grid gap-2">
        <Label for="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          bind:value={data.newPassword}
        />
        <p
          class="text-sm font-medium text-red-500 {!errorMessage.newPassword &&
            'hidden'}"
        >
          {errorMessage.newPassword}
        </p>
      </div>
      <Button type="submit" on:click={onSave} disabled={requestOngoing}>
        <LoaderCircle
          class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
        />
        {!requestOngoing ? "Change" : "Please wait"}
      </Button>
    </form>
  </Sheet.Content>
</Sheet.Root>
