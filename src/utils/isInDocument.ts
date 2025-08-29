export function isInDocument(element: Element) {
    while (element.parentNode) {
        element = element.parentNode as Element;
        if (element === document.body) {
            return true;
        }
    }
}