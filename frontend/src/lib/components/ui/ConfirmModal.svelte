<script module lang="ts">
    import { mount, unmount } from "svelte";
    import ConfirmModal from "./ConfirmModal.svelte";

    // One shared in-page confirm for removes: `if (!(await askConfirm("Remove this…?"))) return;`
    // Mounts a ConfirmModal on <body>, resolves true on "Remove this item", false otherwise.
    export function askConfirm(question: string): Promise<boolean> {
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
            instance = mount(ConfirmModal, { target, props: { question, onAnswer: done } });
        });
    }
</script>

<script lang="ts">
    import Modal from "./Modal.svelte";

    let { question, onAnswer } = $props<{
        question: string;
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
            >Not right now</button
        >
        <button
            type="button"
            onclick={() => answer(true)}
            class="px-5 py-2.5 text-sm font-bold bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-colors"
            >Remove this item</button
        >
    </div>
</Modal>
