<script lang="ts">
  import type { LayoutData } from "./$types";
  import { Sidebar } from "@/components/ui/sidebar";
  import * as DropdownMenu from "@/components/ui/dropdown-menu";
  import * as Sheet from "@/components/ui/sheet";
  import { validate as validateUUID } from "uuid";
  import { PanelLeft, Sun, Moon, LogOut } from "lucide-svelte";
  import { Button } from "@/components/ui/button";
  import * as Breadcrumb from "@/components/ui/breadcrumb";
  import * as Drawer from "@/components/ui/drawer";
  import { resetMode, setMode } from "mode-watcher";
  import { mediaQuery } from "svelte-legos";
  import { capitalizeText } from "@/utils";

  export let data: LayoutData;

  let openBreadCrumbDropdownMenu = false;

  const BREADCRUMB_ITEMS_TO_DISPLAY = 3;
  const isDesktop = mediaQuery("(min-width: 768px)");
</script>

<svelte:head>
  <title>
    {data.pageTitle}
  </title>
</svelte:head>

<main class="flex min-h-screen w-full flex-col bg-muted/40">
  <aside
    class="fixed inset-y-0 left-0 z-10 hidden w-[250px] flex-col border-r bg-background sm:flex"
  >
    <Sidebar
      isMenuCollapsed={data.isMenuCollapsed}
      currentPage={data.currentPage}
    />
  </aside>
  <div class="flex flex-col pb-6 sm:gap-4 sm:pl-[250px]">
    <header
      class="sticky top-0 z-30 flex h-16 justify-between items-center gap-4 border-b bg-background px-4 py-3 sm:h-auto sm:px-6"
    >
      {#if !$isDesktop}
        <Sheet.Root>
          <Sheet.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              size="icon"
              variant="outline"
              class="sm:hidden"
            >
              <PanelLeft class="h-5 w-5" />
              <span class="sr-only">Toggle Menu</span>
            </Button>
          </Sheet.Trigger>
          <Sheet.Content side="left" class="sm:max-w-[250px]">
            <Sidebar
              isMenuCollapsed={data.isMenuCollapsed}
              currentPage={data.currentPage}
            />
          </Sheet.Content>
        </Sheet.Root>
      {/if}
      <Breadcrumb.Root class="hidden md:flex">
        <Breadcrumb.List class="text-base">
          {#if data.breadCrumbItems.length == 1}
            <Breadcrumb.Item>
              <Breadcrumb.Page>
                {capitalizeText(data.breadCrumbItems[0].label, true)}
              </Breadcrumb.Page>
            </Breadcrumb.Item>
          {:else}
            <Breadcrumb.Item>
              <Breadcrumb.Link href={data.breadCrumbItems[0].href}>
                {capitalizeText(data.breadCrumbItems[0].label, true)}
              </Breadcrumb.Link>
            </Breadcrumb.Item>
          {/if}

          {#if data.breadCrumbItems.length > 1}
            {#if data.breadCrumbItems.length > BREADCRUMB_ITEMS_TO_DISPLAY}
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                {#if $isDesktop}
                  <DropdownMenu.Root bind:open={openBreadCrumbDropdownMenu}>
                    <DropdownMenu.Trigger
                      class="flex items-center gap-1"
                      aria-label="Toggle menu"
                    >
                      <Breadcrumb.Ellipsis class="h-4 w-4" />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="start">
                      {#each data.breadCrumbItems.slice(1, -2) as item}
                        {#if item.href != "#"}
                          <DropdownMenu.Item href={item.href}>
                            {capitalizeText(item.label, true)}
                          </DropdownMenu.Item>
                        {/if}
                      {/each}
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                {:else}
                  <Drawer.Root bind:open={openBreadCrumbDropdownMenu}>
                    <Drawer.Trigger aria-label="Toggle Menu">
                      <Breadcrumb.Ellipsis class="h-4 w-4" />
                    </Drawer.Trigger>
                    <Drawer.Content>
                      <Drawer.Header class="text-left">
                        <Drawer.Title>Navigate to</Drawer.Title>
                        <Drawer.Description>
                          Select a page to navigate to.
                        </Drawer.Description>
                      </Drawer.Header>
                      <div class="grid gap-1 px-4">
                        {#each data.breadCrumbItems.slice(1, -2) as item}
                          {#if item.href != "#"}
                            <a href={item.href} class="py-1 text-sm">
                              {capitalizeText(item.label, true)}
                            </a>
                          {/if}
                        {/each}
                      </div>
                      <Drawer.Footer class="pt-4">
                        <Drawer.Close asChild let:builder>
                          <Button variant="outline" builders={[builder]}>
                            Close
                          </Button>
                        </Drawer.Close>
                      </Drawer.Footer>
                    </Drawer.Content>
                  </Drawer.Root>
                {/if}
              </Breadcrumb.Item>
            {/if}
            {#each data.breadCrumbItems.slice(-BREADCRUMB_ITEMS_TO_DISPLAY + 1) as item}
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                {#if item.href == data.currentPage}
                  <Breadcrumb.Page class="max-w-32 truncate">
                    {!validateUUID(item.label)
                      ? capitalizeText(item.label, true)
                      : item.label}
                  </Breadcrumb.Page>
                {:else}
                  <Breadcrumb.Link href={item.href} class="max-w-32 truncate">
                    {!validateUUID(item.label)
                      ? capitalizeText(item.label, true)
                      : item.label}
                  </Breadcrumb.Link>
                {/if}
              </Breadcrumb.Item>
            {/each}
          {/if}
        </Breadcrumb.List>
      </Breadcrumb.Root>
      <div class="gap-4 flex justify-center items-center">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <Button builders={[builder]} variant="outline" size="icon">
              <Sun
                class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
              />
              <Moon
                class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
              />
              <span class="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item on:click={() => setMode("light")}>
              Light
            </DropdownMenu.Item>
            <DropdownMenu.Item on:click={() => setMode("dark")}>
              Dark
            </DropdownMenu.Item>
            <DropdownMenu.Item on:click={() => resetMode()}>
              System
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        <Button variant="outline" href="/app/logout" title="Logout" size="icon">
          <LogOut
            class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all"
          />
          <span class="sr-only">Logout</span>
        </Button>
      </div>
    </header>
    <section class="p-4 sm:px-6 sm:py-0">
      <slot />
    </section>
  </div>
</main>
