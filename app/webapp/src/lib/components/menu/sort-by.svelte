<script lang="ts">
  import { ArrowDown, ArrowUp, ListFilter } from "lucide-svelte/icons";
  import * as DropdownMenu from "@/components/ui/dropdown-menu";
  import { Button } from "@/components/ui/button";

  export let sortOptions: { name: string; value: string }[];
  export let sortBy: { by: string; ascending?: boolean };
  export let onSortBy: (by: string) => void;
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button builders={[builder]} variant="outline" class="gap-1.5 h-10">
      <ListFilter class="h-3.5 w-3.5" />
      <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">Sort</span>
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-[160px]" align="end">
    <DropdownMenu.Label>Sort by</DropdownMenu.Label>
    <DropdownMenu.Separator />
    <div class="max-h-40 overflow-auto">
      {#each sortOptions as option}
        <DropdownMenu.Item
          on:click={() => onSortBy(option.value)}
          class="flex justify-between items-center gap-3 {option.value ==
            sortBy.by && 'text-primary data-[highlighted]:text-primary'}"
        >
          {option.name}
          <ArrowUp
            class="mr-2 h-4 w-4 {sortBy.ascending
              ? option.value == sortBy.by
                ? 'visible'
                : 'invisible'
              : 'hidden'}"
          />
          <ArrowDown
            class="mr-2 h-4 w-4  {!sortBy.ascending
              ? option.value == sortBy.by
                ? 'visible'
                : 'invisible'
              : 'hidden'} "
          />
        </DropdownMenu.Item>
      {/each}
    </div>
  </DropdownMenu.Content>
</DropdownMenu.Root>
