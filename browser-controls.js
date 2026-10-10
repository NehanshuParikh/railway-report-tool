/* Convenience deterrents only: browser menus and downloaded source remain accessible. */
(function (root) {
    'use strict';
    function blockedShortcut(event) {
        const key = String(event.key || '').toUpperCase();
        if (key === 'F12' || event.code === 'F12') return true;
        const inspectKey = ['I', 'J', 'C'].includes(key);
        if (event.ctrlKey && event.shiftKey && inspectKey) return true;
        if (event.metaKey && (event.altKey || event.shiftKey) && inspectKey) return true;
        if (key === 'U' && (event.ctrlKey || (event.metaKey && event.altKey))) return true;
        return false;
    }
    if (root.document) {
        root.document.addEventListener('contextmenu', event => event.preventDefault(), true);
        root.document.addEventListener('keydown', event => {
            if (blockedShortcut(event)) event.preventDefault();
        }, true);
    }
    if (typeof module !== 'undefined') module.exports = {blockedShortcut};
})(typeof window !== 'undefined' ? window : globalThis);
