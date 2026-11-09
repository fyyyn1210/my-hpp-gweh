export class TtlCache<T> {
    private readonly items = new Map<string, { value: T; expires: number }>();

    constructor(private readonly max: number, private readonly ttlMs: number) {}

    get(key: string) {
        const hit = this.items.get(key);
        if (!hit) return undefined;
        this.items.delete(key);
        if (hit.expires < Date.now()) return undefined;
        this.items.set(key, hit);
        return hit.value;
    }

    set(key: string, value: T) {
        this.items.delete(key);
        this.items.set(key, { value, expires: Date.now() + this.ttlMs });
        if (this.items.size > this.max) this.items.delete(this.items.keys().next().value!);
    }
}
