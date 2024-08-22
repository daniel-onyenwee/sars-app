<script lang="ts">
  import { Button } from "@/components/ui/button";
  import { page } from "$app/stores";
</script>

<svelte:head>
  <title>
    {$page.status} - {$page.error?.message}
  </title>
</svelte:head>

<main
  class="bg-muted/40 h-screen w-screen flex justify-center flex-col items-center gap-4"
>
  <p class="text-muted-foreground text-7xl">Oops!</p>
  <p class="text-muted-foreground mt-2 text-lg">
    {$page.status} - {$page.error?.message}
  </p>
  <Button href="/">GO TO HOMEPAGE</Button>
</main>
