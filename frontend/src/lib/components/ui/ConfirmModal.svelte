<script module lang="ts">
    import { mount, unmount } from "svelte";
    import ConfirmModal from "./ConfirmModal.svelte";

    // One shared in-page confirm for removes: `if (!(await askConfirm("Remove this…?"))) return;`
    // Mounts a ConfirmModal on <body>, resolves true on the confirm button ("Remove this item", or `label`), false otherwise.
    export function askConfirm(question: string, label?: string): Promise<boolean> {
        if (typeof document === "undefined") return Promise.resolve(false);
        return new Promise((resolve) => {
            const target = document.createElement("div");
            document.body.appendChild(target);
            let instance: Record<string, unknown> | null = null;
            const done = (answer: boolean) => {
                resolve(answer);
                // Let the close transition finish before removing the node.
                setTimeout(() => {
                    if (instance) unmount(instance);
                    target.remove();
                }, 300);
            };
            instance = mount(ConfirmModal, { target, props: { question, label, onAnswer: done } });
        });
    }
</script>

<script lang="ts">
    import Modal from "./Modal.svelte";

    let { question, label, onAnswer } = $props<{
        question: string;
        label?: string;
        onAnswer: (answer: boolean) => void;
    }>();

    let open = $state(true);
    let answered = false;

    function answer(value: boolean) {
        if (answered) return;
        answered = true;
        open = false;
        onAnswer(value);
    }
</script>

<Modal bind:open title={question} onClose={() => answer(false)}>
    <div class="flex justify-end gap-3">
        <button
            type="button"
            onclick={() => answer(false)}
            class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-black/5 rounded-lg transition-colors"
            >Maybe later</button
        >
        <button
            type="button"
            onclick={() => answer(true)}
            class="px-5 py-2.5 text-sm font-bold text-white rounded-lg shadow transition-colors {label
                ? 'bg-primary hover:opacity-90'
                : 'bg-red-600 hover:bg-red-700'}"
            >{label ?? "Remove this item"}</button
        >
    </div>
</Modal>
