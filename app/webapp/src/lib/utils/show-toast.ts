import { toast } from "svelte-sonner"

export function showToast(
    type: "ERROR" | "SUCCESS",
    title: string,
    description: string = "",
    callback: () => void = () => { }
) {
    setTimeout(() => {
        if (type == "SUCCESS") {
            toast.success(title, {
                description,
            });
        } else if (type == "ERROR") {
            toast.error(title, {
                description,
            });
        } else {
            toast.info(title, {
                description,
            });
        }

        callback();
    }, 200);
}