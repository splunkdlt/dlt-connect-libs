export function removeEmtpyValues<R extends { [k: string]: any }, I extends { [P in keyof R]: any | null | undefined }>(
    obj: I
): R {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null)) as R;
}

/**
 * Recursively (deeply) merges 2 object of the same type. It only merges plain object, not arrays.
 * It does not mutate the original object but may return references to (parts of the) orginal object.
 */
export function deepMerge<T extends { [k: string]: any }>(a: T, b: T): T {
    return Object.fromEntries([
        ...Object.entries(a).map(([k, v]) => {
            if (typeof v === 'object' && !Array.isArray(v)) {
                return [k, b[k] == null ? v : deepMerge(v, b[k] ?? {})];
            }
            return [k, b[k] ?? v];
        }),
        ...Object.entries(b).filter(([k]) => !(k in a)),
    ]);
}

export const sleep = (time: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, time));
