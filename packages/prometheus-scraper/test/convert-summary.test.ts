import { quantileToMetricSuffix } from '../src/convert/summary';

test('quantileToMetricSuffix', () => {
    expect(quantileToMetricSuffix('0.05')).toBe('p05');
    expect(quantileToMetricSuffix('0.5')).toBe('p50');
    expect(quantileToMetricSuffix('0.99')).toBe('p99');
    expect(quantileToMetricSuffix('0.999')).toBe('p999');
    expect(quantileToMetricSuffix('0.99999')).toBe('p99999');
});
