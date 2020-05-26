import fetch from 'node-fetch';
import { stringify as qs } from 'querystring';
import { Agent } from 'https';

const httpsAgent = new Agent({
    rejectUnauthorized: false,
});

export interface SearchArgs {
    search: string;
    earliest?: string;
    latest?: string;
    splunkd: { url: string; user: string; password: string };
    waitUntil?: { predicate: (data: any) => boolean; attempts: number; waitBetween: number };
}

const qualifiedSearch = (q: string) => (q.trim().startsWith('|') ? q : `search ${q}`);

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function runSearch<T = any>({
    splunkd,
    search,
    earliest = '0',
    latest = '',
    waitUntil,
    attempt = 0,
}: SearchArgs & { attempt?: number }): Promise<Array<T>> {
    const url = new URL(splunkd.url);
    url.pathname = `/servicesNS/${splunkd.user}/search/search/jobs`;
    url.searchParams.set('output_mode', 'json');

    const body = qs({
        output_mode: 'json',
        search: qualifiedSearch(search),
        earliest_time: earliest,
        latest_time: latest,
        exec_mode: 'oneshot',
        count: '0',
    });

    const res = await fetch(url.href, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${splunkd.user}:${splunkd.password}`, 'utf-8').toString('base64')}`,
        },
        body,
        agent: url.protocol === 'https:' ? httpsAgent : undefined,
    });

    if (!res.ok) {
        try {
            const text = await res.text();
            throw new Error(`Splunkd[status=${res.status}]: ${text}`);
        } catch (e) {
            // ignore
        }
        throw new Error(`Splunkd returned HTTP status ${res.status}`);
    }

    const data = await res.json();

    if (waitUntil != null && waitUntil.predicate(data) === false && attempt < waitUntil.attempts - 1) {
        await sleep(waitUntil.waitBetween);
        return runSearch({
            splunkd,
            search,
            earliest,
            latest,
            waitUntil,
            attempt: attempt + 1,
        });
    }

    return data.results;
}

export const hasResults = ({ attempts, waitBetween = 250 }: { attempts: number; waitBetween?: number }) => ({
    attempts,
    waitBetween,
    predicate(data: any): boolean {
        return data != null && data.results != null && data.results.length > 0;
    },
});
