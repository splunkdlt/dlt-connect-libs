import { LRUCache, cached, cachedAsync } from '../src';

test('cached', () => {
    const cache = new LRUCache<string, string>({ maxSize: 1000 });

    let i = 0;
    const producer = (k: string) => {
        return k + ++i;
    };

    expect(cached('foo', cache, producer)).toBe('foo1');
    expect(cached('foo', cache, producer)).toBe('foo1');
    expect(cached('bar', cache, producer)).toBe('bar2');
});

test('cachedAsync', async () => {
    const cache = new LRUCache<string, Promise<string>>({ maxSize: 1000 });

    let i = 0;
    const producer = async (k: string) => {
        i++;
        if (i % 3 === 0) throw new Error('rejecto');
        return k + i;
    };

    await expect(cachedAsync('foo', cache, producer)).resolves.toBe('foo1');
    await expect(cachedAsync('foo', cache, producer)).resolves.toBe('foo1');
    await expect(cachedAsync('foo', cache, producer)).resolves.toBe('foo1');
    await expect(cachedAsync('foo', cache, producer)).resolves.toBe('foo1');
    await expect(cachedAsync('foo', cache, producer)).resolves.toBe('foo1');
    await expect(cachedAsync('foo', cache, producer)).resolves.toBe('foo1');
    await expect(cachedAsync('bar', cache, producer)).resolves.toBe('bar2');
    await expect(cachedAsync('ding', cache, producer)).rejects.toMatchInlineSnapshot(`[Error: rejecto]`);
    await expect(cachedAsync('ding', cache, producer)).resolves.toBe('ding4');
});
