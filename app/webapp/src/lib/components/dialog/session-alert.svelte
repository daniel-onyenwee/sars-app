<script>
  import * as AlertDialog from "@/components/ui/alert-dialog";
  import { goto } from "$app/navigation";

  let open = false;

  export function show() {
    open = true;
  }

  export function close() {
    open = false;
  }
</script>

<AlertDialog.Root closeOnOutsideClick={false} closeOnEscape={false} bind:open>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Login session expired</AlertDialog.Title>
      <AlertDialog.Description>
        Your login session has expired. Please login to continue.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Action on:click={async () => await goto("/app/login")}
        >Login</AlertDialog.Action
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
