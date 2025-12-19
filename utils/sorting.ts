/**
 * Utility for natural sorting of strings and objects.
 * This ensures that "Folder 2" comes before "Folder 10".
 */

export const naturalCompare = (a: string, b: string): number => {
    return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base'
    });
};

export const naturalSort = <T>(
    items: T[],
    keyGetter: (item: T) => string
): T[] => {
    return [...items].sort((a, b) => {
        return naturalCompare(keyGetter(a), keyGetter(b));
    });
};
