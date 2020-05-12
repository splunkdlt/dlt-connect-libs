import BufferList from 'bl';
import { createGzip } from 'zlib';
import { createModuleDebug } from '@splunkdlt/debug-logging';

const { trace } = createModuleDebug('@splunkdlt/hec-client:compress');

export function compressBody(source: BufferList): Promise<BufferList> {
    return new Promise((resolve, reject) => {
        const stream = createGzip();
        const result = new BufferList();
        const sourceSize = source.length;
        stream.pipe(result);
        stream.once('end', () => {
            trace(`Compressed batch of HEC messages from ${sourceSize} bytes -> ${result.length} bytes`);
            resolve(result);
        });
        stream.once('error', (e) => reject(e));
        source.pipe(stream, { end: true });
    });
}
