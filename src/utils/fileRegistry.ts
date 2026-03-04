/**
 * In-memory registry to hold File objects (cannot be JSON-serialized).
 * Key: tabId, Value: the selected File for the binary body.
 */
const registry = new Map<string, File>();

export const fileRegistry = {
    set: (tabId: string, file: File) => registry.set(tabId, file),
    get: (tabId: string): File | undefined => registry.get(tabId),
    remove: (tabId: string) => registry.delete(tabId),
    clear: () => registry.clear(),
};
