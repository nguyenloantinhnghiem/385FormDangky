type CacheEntry<T> = {
    value?: T;
    expiresAt: number;
    inFlight?: Promise<T>;
};

const DEFAULT_TTL_MS = Number(process.env.SHEET_CACHE_TTL_MS || 45_000);
const store = new Map<string, CacheEntry<unknown>>();

export function getDefaultSheetCacheTtl(): number {
    return Number.isFinite(DEFAULT_TTL_MS) && DEFAULT_TTL_MS > 0 ? DEFAULT_TTL_MS : 45_000;
}

export async function getOrSetTtlCache<T>(
    key: string,
    producer: () => Promise<T>,
    ttlMs = getDefaultSheetCacheTtl(),
): Promise<T> {
    const now = Date.now();
    const existing = store.get(key) as CacheEntry<T> | undefined;

    if (existing?.value !== undefined && existing.expiresAt > now) {
        return existing.value;
    }

    if (existing?.inFlight) {
        return existing.inFlight;
    }

    const inFlight = producer()
        .then((value) => {
            store.set(key, {
                value,
                expiresAt: Date.now() + ttlMs,
            });
            return value;
        })
        .catch((error) => {
            store.delete(key);
            throw error;
        });

    store.set(key, {
        value: existing?.value,
        expiresAt: existing?.expiresAt || 0,
        inFlight,
    });

    return inFlight;
}

export function clearTtlCache(prefix?: string): void {
    if (!prefix) {
        store.clear();
        return;
    }

    for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
    }
}
