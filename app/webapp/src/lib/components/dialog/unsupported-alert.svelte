<script>
  import * as AlertDialog from "@/components/ui/alert-dialog";
  import { onMount } from "svelte";

  let open = false;

  onMount(() => {
    open = window.electron ? false : true;
  });
</script>

<AlertDialog.Root closeOnOutsideClick={false} closeOnEscape={false} bind:open>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Unsupported Platform</AlertDialog.Title>
      <AlertDialog.Description>
        Unfortunately, this application does not support your current browser
        configuration.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Action on:click={async () => window.location.reload()}>
        Try again
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
