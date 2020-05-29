import fetch from 'node-fetch';
import { Agent } from 'https';

export async function checkUrlAcessible(url: string) {
    const u = new URL(url);
    return await fetch(url, {
        agent: u.protocol === 'https:' ? new Agent({ rejectUnauthorized: false }) : undefined,
    });
}

export async function ensureHecAccessible(hecUrl: string) {
    // wait for hec to be available
    const start = Date.now();
    while (Date.now() - start < 120_000) {
        await new Promise((r) => setTimeout(r, 500));
        try {
            await checkUrlAcessible(hecUrl);
            // Successfully connet4ed
            return;
        } catch (e) {
            // ignore
        }
    }

    throw new Error(`Unable to connect to HEC ${hecUrl}`);
}
