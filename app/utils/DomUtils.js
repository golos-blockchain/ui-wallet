export function findParent(el, class_name) {
    if (el.className && el.className.indexOf && el.className.indexOf(class_name) !== -1) return el;
    if (el.parentNode) return findParent(el.parentNode, class_name);
    return null;
}

export function findModalRoot(el) {
    if (el) {
        if (el.getAttribute && el.getAttribute('role') === 'dialog') return el
        if (el.parentNode) return findModalRoot(el.parentNode)
    }
    return null
}

export function hideElement(node) {
    node.style.display = 'none'
}

export function showElement(node, visibility) {
    node.style.display = visibility
}
