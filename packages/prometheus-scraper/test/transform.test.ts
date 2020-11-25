import { underscoreToDotNotation } from '../src/transform';

test('underscoreToDotNotation', () => {
    expect(underscoreToDotNotation('http_requests_total')).toEqual('http.requests.total');
});
