<script lang="ts">
  import * as Card from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { LoaderCircle } from "lucide-svelte/icons";
  import { toast } from "svelte-sonner";
  import { login } from "@/services";
  import { goto } from "$app/navigation";

  interface UserDetail {
    password: string;
  }

  async function onContinue() {
    requestOngoing = true;

    userDetailErrorMessage = {};

    if (!userDetail.password) {
      userDetailErrorMessage.password = "Required field";
      requestOngoing = false;
      return;
    }

    try {
      let platformSystem = window.electron
        ? {
            platform: "Electron",
            systemPassword:
              await window.electron.engine.config("admin.password"),
          }
        : {
            platform: "Browser",
          };

      let { error } = await login({
        ...platformSystem,
        password: userDetail.password,
      } as any);

      if (error) {
        if (error.code == 2001) {
          userDetailErrorMessage.password = error.message;
        } else {
          toast.error("Request failed", {
            description: error.message,
          });
        }

        requestOngoing = false;
        return;
      }

      toast.success("Request successful", {
        description: "Login successfully",
      });

      await goto("/app");
    } catch (error) {
      toast.error("Request failed", {
        description: "Unexpected error",
      });
    }

    requestOngoing = false;
  }

  let userDetail: Partial<UserDetail> = {};
  let userDetailErrorMessage: Partial<Record<keyof UserDetail, string>> = {};
  let requestOngoing: boolean = false;
</script>

<svelte:head>
  <title>Login - SARs</title>
</svelte:head>

<main class="bg-muted/40 h-screen w-screen flex justify-center items-center">
  <Card.Root class="w-[350px] mx-auto max-w-sm">
    <Card.Header>
      <Card.Title class="text-2xl">Login</Card.Title>
      <Card.Description>
        Instant dashboard access with one-click.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form>
        <div class="grid w-full items-center gap-4">
          <div class="flex flex-col space-y-1.5">
            <Label
              class={userDetailErrorMessage.password && "text-red-500"}
              for="password">Password</Label
            >
            <Input
              id="password"
              bind:value={userDetail.password}
              type="password"
              placeholder="Password"
            />
            <p
              class="text-sm font-medium text-red-500 {!userDetailErrorMessage.password &&
                'hidden'}"
            >
              {userDetailErrorMessage.password}
            </p>
          </div>
        </div>
      </form>
    </Card.Content>
    <Card.Footer>
      <Button disabled={requestOngoing} class="w-full" on:click={onContinue}>
        <LoaderCircle
          class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
        />
        {!requestOngoing ? "Continue" : "Please wait"}
      </Button>
    </Card.Footer>
  </Card.Root>
</main>
