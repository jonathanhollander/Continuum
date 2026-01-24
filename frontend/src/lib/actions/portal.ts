/**
 * Usage: <div use:portal={'css-selector'}> or <div use:portal={element}>
 *
 * @param {HTMLElement} node
 * @param {HTMLElement|string} target
 */
export function portal(node: HTMLElement, target: HTMLElement | string = "body") {
    let targetEl: HTMLElement | null;

    async function update(newTarget: HTMLElement | string) {
        targetEl = typeof newTarget === "string" ? document.querySelector(newTarget) : newTarget;
        if (targetEl) {
            targetEl.appendChild(node);
        } else if (newTarget === "body") {
            document.body.appendChild(node);
        }
        node.hidden = false;
    }

    function destroy() {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }

    update(target);

    return {
        update,
        destroy,
    };
}
