import { LRUCache } from '../src';

test('simple lru cache', () => {
    const cache = new LRUCache<string, string>({ maxSize: 3 });

    cache.set('foo', 'bar');

    expect(cache.has('foo')).toBe(true);
    expect(cache.get('foo')).toBe('bar');

    cache.set('foo1', 'bar');
    cache.set('foo2', 'bar');
    cache.set('foo3', 'bar');
    cache.set('foo4', 'bar');
    cache.set('foo5', 'bar');
    cache.set('foo6', 'bar');

    expect(cache.has('foo')).toBe(false);
    expect(cache.has('foo3')).toBe(true);
    expect(cache.has('foo2')).toBe(false);
});
