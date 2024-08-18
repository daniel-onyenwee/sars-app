// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		type FilterByScheme =
			| {
				type: "text" | "number" | "date" | "time";
				label?: string;
			}
			| {
				type: "select";
				label?: string;
				options: Array<{ label?: string; value: string }> | Array<string>;
			}

		// interface Error {}
		interface Locals {
			session: {
				expireIn: number
				accessToken: string
				refreshToken: string
			}
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
