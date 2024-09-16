// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

type JsonObject = {
	[Key in string]?: JsonValue
}

type JsonValue = string | number | boolean | JsonObject | Array<JsonValue> | null

interface DialogOpenReturnType {
	/**
	* whether or not the dialog was canceled.
	*/
	canceled: boolean
	/**
	 * An array of file paths chosen by the user. If the dialog is cancelled this will
	 * be an empty array.
	 */
	filePaths: string[]
}

interface DialogSaveReturnType {
	/**
	* whether or not the dialog was canceled.
	*/
	canceled: boolean
	/**
	 * If the dialog is canceled, this will be `undefined`.
	 */
	filePath?: string
}

interface DialogOpenOptions {
	/**
	 * The dialog title. Cannot be displayed on some _Linux_ desktop environments.
	 */
	title?: string,
	filters?: {
		extensions: string[];
		name: string;
	}[],
	defaultPath?: string
	multiSelections?: boolean,
	openType?: "directory" | "file",
	/**
	 * Custom label for the confirmation button, when left empty the default label will
	 * be used.
	 */
	buttonLabel?: string
}

interface DialogSaveOptions {
	/**
	 * The dialog title. Cannot be displayed on some _Linux_ desktop environments.
	 */
	title?: string,
	filters?: {
		extensions: string[];
		name: string;
	}[],
	defaultPath?: string
	/**
	 * Custom label for the confirmation button, when left empty the default label will
	 * be used.
	 */
	buttonLabel?: string
}

export interface IElectron {
	engine: {
		config: (key?: string, value?: string) => Promise<JsonValue>
		log: {
			output: (filePath: string) => Promise<void>,
			apply: (logFile: string) => Promise<void>
		}
	},
	dialog: {
		open: (options?: DialogOpenOptions) => Promise<DialogOpenReturnType>,
		save: (options?: DialogSaveOptions) => Promise<DialogSaveReturnType>
	},
	theme: (mode: string) => Promise<"system" | "light" | "dark">,
	showItem: (itemPath: string) => Promise<void>,
	download: (filename: string, data: ArrayBuffer) => Promise<void>,
	showAboutPanel: () => Promise<void>,
	showTutorial: () => Promise<void>,
	reload: () => Promise<void>,
	restart: () => Promise<void>,
	quit: () => Promise<void>
}

declare global {
	interface Window {
		electron: IElectron
	}
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
