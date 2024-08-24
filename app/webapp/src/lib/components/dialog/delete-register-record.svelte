<script lang="ts">
  import { mediaQuery } from "svelte-legos";
  import { LoaderCircle } from "lucide-svelte/icons";
  import { capitalizeText, removeUnderscore, showToast } from "@/utils";
  import {
    deleteAttendanceRegisters,
    deleteAttendanceRegisterLecturers,
    deleteAttendanceRegisterStudents,
  } from "@/services";
  import * as Dialog from "@/components/ui/dialog";
  import * as Drawer from "@/components/ui/drawer";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher } from "svelte";

  export let accessToken: string;

  export let type:
    | "ATTENDANCE_REGISTER"
    | "ATTENDANCE_REGISTER_STUDENT"
    | "ATTENDANCE_REGISTER_LECTURER";

  export function show(recordsId: string[] = [], registerId?: string) {
    if (registerId) {
      attendanceRegisterId = registerId;
    }
    dataToDeleteId = recordsId;
    open = true;
  }

  export function close() {
    internalClose();
    open = false;
  }

  function internalClose() {
    attendanceRegisterId = null;
    dataToDeleteId = [];
  }

  async function onDelete() {
    requestOngoing = true;

    try {
      let serviceRequest = null;

      if (type == "ATTENDANCE_REGISTER") {
        serviceRequest = await deleteAttendanceRegisters({
          accessToken: accessToken,
          registersId: dataToDeleteId,
        });
      } else if (type == "ATTENDANCE_REGISTER_LECTURER") {
        if (!attendanceRegisterId) {
          requestOngoing = false;
          close();

          showToast("ERROR", "Request failed", "Register not found");
          return;
        }

        serviceRequest = await deleteAttendanceRegisterLecturers({
          accessToken: accessToken,
          registerId: attendanceRegisterId,
          attendanceRegisterLecturersId: dataToDeleteId,
        });
      } else if (type == "ATTENDANCE_REGISTER_STUDENT") {
        if (!attendanceRegisterId) {
          requestOngoing = false;
          close();

          showToast("ERROR", "Request failed", "Register not found");
          return;
        }

        serviceRequest = await deleteAttendanceRegisterStudents({
          accessToken: accessToken,
          registerId: attendanceRegisterId,
          attendanceRegisterStudentsId: dataToDeleteId,
        });
      }

      if (!serviceRequest) {
        throw new Error();
      }

      if (serviceRequest.error) {
        requestOngoing = false;
        close();

        if (
          serviceRequest.error.code >= 1001 &&
          serviceRequest.error.code < 1004
        ) {
          dispatch("sessionError");
        } else {
          showToast(
            "ERROR",
            "Request failed",
            serviceRequest.error.code == 4015
              ? "Register not found"
              : serviceRequest.error.message
          );
        }
        return;
      }

      showToast(
        "SUCCESS",
        "Request successful",
        `${capitalizeText(dialogTitle().replace("register ", String()))} successfully deleted`
      );
      dispatch("successful");
    } catch {
      showToast("ERROR", "Request failed", "Unexpected error");
    }

    requestOngoing = false;
    close();
  }

  function dialogTitle() {
    let title = type.toLowerCase().replace("attendance_", String());

    title = removeUnderscore(
      type.toLowerCase().replace("attendance_", String()),
      " "
    );

    return dataToDeleteId.length > 1 ? `${title}s` : title;
  }

  let requestOngoing: boolean = false;
  let open = false;
  let attendanceRegisterId: string | null = null;
  let isDesktop = mediaQuery("(min-width: 768px)");
  let dispatch = createEventDispatcher();
  let dataToDeleteId: string[] = [];
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
        <Dialog.Title>Delete {dialogTitle()}</Dialog.Title>
        <Dialog.Description>
          This action cannot be undone. This will permanently delete the
          {dialogTitle()} and remove data depending on it.
        </Dialog.Description>
      </Dialog.Header>
      <div class="grid items-start gap-4">
        <Button
          on:click={onDelete}
          disabled={requestOngoing}
          variant="destructive"
        >
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing ? "Delete" : "Please wait"}
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
        <Drawer.Title>Delete {dialogTitle()}</Drawer.Title>
        <Drawer.Description>
          This action cannot be undone. This will permanently delete the
          {dialogTitle()} and remove data depending on it.
        </Drawer.Description>
      </Drawer.Header>
      <Drawer.Footer class="pt-2">
        <Button
          on:click={onDelete}
          disabled={requestOngoing}
          variant="destructive"
        >
          <LoaderCircle
            class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
          />
          {!requestOngoing ? "Delete" : "Please wait"}
        </Button>
        <Drawer.Close disabled={requestOngoing} asChild let:builder>
          <Button variant="outline" builders={[builder]}>Cancel</Button>
        </Drawer.Close>
      </Drawer.Footer>
    </Drawer.Content>
  </Drawer.Root>
{/if}
