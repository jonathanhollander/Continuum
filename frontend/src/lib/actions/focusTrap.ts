// Keeps keyboard focus inside a dialog while it is mounted, closes it on Escape,
// and hands focus back to the control that opened it once it goes away.
// Only the innermost mounted dialog answers Tab and Escape.

const FOCUSABLE =
    'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

const stack: HTMLElement[] = [];

export interface FocusTrapOptions {
    onEscape?: () => void;
}

function focusables(node: HTMLElement): HTMLElement[] {
    return [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.getClientRects().length > 0 && !el.closest("[inert]"),
    );
}

export function focusTrap(node: HTMLElement, options: FocusTrapOptions = {}) {
    let opts = options;
    const opener = document.activeElement as HTMLElement | null;
    stack.push(node);
    if (!node.hasAttribute("tabindex")) node.setAttribute("tabindex", "-1");

    function onKeydown(e: KeyboardEvent) {
        if (stack[stack.length - 1] !== node) return;
        if (e.key === "Escape" && opts.onEscape) {
            e.preventDefault();
            e.stopPropagation();
            opts.onEscape();
            return;
        }
        if (e.key !== "Tab") return;
        const items = focusables(node);
        const active = document.activeElement as HTMLElement | null;
        if (items.length === 0) {
            e.preventDefault();
            node.focus();
            return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const inside = !!active && node.contains(active);
        if (e.shiftKey && (!inside || active === first || active === node)) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && (!inside || active === last)) {
            e.preventDefault();
            first.focus();
        }
    }

    window.addEventListener("keydown", onKeydown);
    // Wait a frame so the dialog's own content (and any autofocus) has rendered.
    requestAnimationFrame(() => {
        if (!node.isConnected || node.contains(document.activeElement)) return;
        (focusables(node)[0] ?? node).focus();
    });

    return {
        update(next: FocusTrapOptions = {}) {
            opts = next;
        },
        destroy() {
            window.removeEventListener("keydown", onKeydown);
            const i = stack.indexOf(node);
            if (i !== -1) stack.splice(i, 1);
            if (opener && opener !== document.body && opener.isConnected) {
                opener.focus();
            }
        },
    };
}
