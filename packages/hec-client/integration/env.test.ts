import { versionSupportsMultiMetrics } from './env';

test('versionSupportsMultiMetrics', () => {
    expect(versionSupportsMultiMetrics('8.0.4')).toBe(true);
    expect(versionSupportsMultiMetrics('7.3.5')).toBe(false);
    expect(versionSupportsMultiMetrics('7.2.10.1')).toBe(false);
    expect(versionSupportsMultiMetrics()).toBe(false);
});
