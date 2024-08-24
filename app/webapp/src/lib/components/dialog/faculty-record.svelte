<script lang="ts">
  import { LoaderCircle } from "lucide-svelte/icons";
  import { showToast } from "@/utils";
  import { createFaculty, updateFaculty, type FacultyModel } from "@/services";
  import * as Sheet from "@/components/ui/sheet";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher } from "svelte";
  import { Label } from "@/components/ui/label";
  import { Input } from "@/components/ui/input";

  export let accessToken: string;

  function show(mode: "CREATE", data: undefined): void;
  function show(mode: "UPDATE" | "VIEW", data: FacultyModel): void;
  export function show(mode: "CREATE" | "UPDATE" | "VIEW", data: any) {
    dialogMode = mode;
    if (mode == "UPDATE" || mode == "VIEW") {
      facultyData = structuredClone(data);
    }
    open = true;
  }

  export function close() {
    internalClose();
    open = false;
  }

  function internalClose() {
    errorMessage = {};
    facultyData = {};
  }

  async function onCreateOrUpdate() {
    requestOngoing = true;

    errorMessage = {};

    if (!facultyData.name) {
      errorMessage.name = "Field required";
      requestOngoing = false;
      return;
    }

    try {
      let serviceRequest = null;

      if (dialogMode == "CREATE") {
        serviceRequest = await createFaculty({
          accessToken: accessToken,
          name: facultyData.name as string,
        });
      } else {
        serviceRequest = await updateFaculty({
          accessToken: accessToken,
          id: facultyData.id as string,
          name: facultyData.name as string,
        });
      }

      if (!serviceRequest) {
        throw new Error();
      }

      if (serviceRequest.error) {
        requestOngoing = false;
        if (
          serviceRequest.error.code >= 1001 &&
          serviceRequest.error.code < 1004
        ) {
          close();
          dispatch("sessionError");
        } else if (serviceRequest.error.code == 3001) {
          errorMessage.name = serviceRequest.error.message;
        } else {
          close();
          showToast("ERROR", "Request failed", serviceRequest.error.message);
        }
        return;
      }

      showToast(
        "SUCCESS",
        "Request successful",
        `Faculty successfully ${dialogMode == "CREATE" ? "created" : "edited"}`
      );
      dispatch("successful");
    } catch (error) {
      showToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  let requestOngoing: boolean = false;
  let errorMessage: Partial<Record<keyof FacultyModel, string>> = {};
  let facultyData: Partial<FacultyModel> = {};
  let open = false;
  let dialogMode: "CREATE" | "UPDATE" | "VIEW" = "CREATE";
  let dispatch = createEventDispatcher();

  $: dialogTitle =
    dialogMode == "VIEW"
      ? "Faculty details"
      : `${dialogMode == "CREATE" ? "Create" : "Edit"} faculty`;
  $: dialogDescription =
    dialogMode == "VIEW"
      ? "Complete information about the faculty."
      : `${
          dialogMode == "CREATE"
            ? "Create a new faculty here. Click create when you're done."
            : "Make changes to the faculty here. Click save when you're done."
        }`;
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
      <Sheet.Title>{dialogTitle}</Sheet.Title>
      <Sheet.Description>{dialogDescription}</Sheet.Description>
    </Sheet.Header>
    <form class="grid items-start gap-4 mt-4">
      <div class="grid gap-2">
        <Label for="name">Name</Label>
        {#if dialogMode == "VIEW"}
          <span
            class="flex capitalize h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            id="name"
          >
            {facultyData.name}
          </span>
        {:else}
          <Input
            placeholder="Faculty name"
            type="text"
            id="name"
            bind:value={facultyData.name}
          />
          <p
            class="text-sm font-medium text-red-500 {!errorMessage.name &&
              'hidden'}"
          >
            {errorMessage.name}
          </p>
        {/if}
      </div>
      <Button
        type="submit"
        on:click={onCreateOrUpdate}
        disabled={requestOngoing}
        class={dialogMode == "VIEW" ? "hidden" : "visible"}
      >
        <LoaderCircle
          class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
        />
        {!requestOngoing
          ? dialogMode == "CREATE"
            ? "Create"
            : "Save"
          : "Please wait"}
      </Button>
    </form>
  </Sheet.Content>
</Sheet.Root>
