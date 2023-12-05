## Note: This repo is being archived in favor of the same repo under the Splunk Github account from which it was forked. Changes have been commited and merged into that repo.

# Splunk DLT Connector Libraries

This repository hosts a set of common, shared libraries used in TypeScript-based data connectors by the Splunk DLT team. Libraries are written in TypeScript and published as NPM libraries in the `@splunkdlt` NPM organization. All libraries are designed to be used in Node.js and are not tested or expected to work in the browser.

## Packages

<!-- PACKAGE-LIST -->

### [`@splunkdlt/async-tasks`](./packages/async-tasks) [![npm version](https://badge.fury.io/js/%40splunkdlt%2Fasync-tasks.svg)](https://npm.im/%40splunkdlt%2Fasync-tasks)

Generic helpers around asynchronous tasks, parallel execution, retrying and aborting them.

### [`@splunkdlt/cache`](./packages/cache) [![npm version](https://badge.fury.io/js/%40splunkdlt%2Fcache.svg)](https://npm.im/%40splunkdlt%2Fcache)

Simple typescript cache library with simple LRU implementation.

### [`@splunkdlt/debug-logging`](./packages/debug-logging) [![npm version](https://badge.fury.io/js/%40splunkdlt%2Fdebug-logging.svg)](https://npm.im/%40splunkdlt%2Fdebug-logging)

Wrapper around [debug](https://yarnpkg.com/en/package/debug) creating a set of structured debug loggers with a common name prefix.

### [`@splunkdlt/eslint-config-dlt-connect-lib`](./packages/eslint-config) [![npm version](https://badge.fury.io/js/%40splunkdlt%2Feslint-config-dlt-connect-lib.svg)](https://npm.im/%40splunkdlt%2Feslint-config-dlt-connect-lib)

Common eslint config for DLT connect packages

### [`@splunkdlt/hec-client`](./packages/hec-client) [![npm version](https://badge.fury.io/js/%40splunkdlt%2Fhec-client.svg)](https://npm.im/%40splunkdlt%2Fhec-client)

Flexible client library for Splunk HTTP Event Collector (HEC) with support for sending metrics and events, batching, compression, keep-alives and retries.

### [`@splunkdlt/managed-resource`](./packages/managed-resource) [![npm version](https://badge.fury.io/js/%40splunkdlt%2Fmanaged-resource.svg)](https://npm.im/%40splunkdlt%2Fmanaged-resource)

A set of helpers to perform an orderly shutdown of a collector process.

### [`@splunkdlt/prometheus-scraper`](./packages/prometheus-scraper) [![npm version](https://badge.fury.io/js/%40splunkdlt%2Fprometheus-scraper.svg)](https://npm.im/%40splunkdlt%2Fprometheus-scraper)

Utility to help scrape metrics from apps exposing prometheus-style metrics endpoints.

### [`@splunkdlt/stats-collector`](./packages/stats-collector) [![npm version](https://badge.fury.io/js/%40splunkdlt%2Fstats-collector.svg)](https://npm.im/%40splunkdlt%2Fstats-collector)

A helper to collect stats (internal metrics) of a node process to send to Splunk.

<!-- PACKAGE-LIST-END -->

## Docker Images

<!-- DOCKER-IMAGE-LIST -->

### [ghcr.io/splunkdlt/prometheus-scraper](./docker/prometheus-scraper-standalone)

A simple docker image that uses the `@splunkdlt/prometheus-scraper` package to periodically scrape metrics from a prometheus endpoint and forwards them to a Splunk HTTP Event Collector.

<!-- DOCKER-IMAGE-LIST-END -->

## Contributing

Thank you for considering to contribute to Splunk DLT Connect Libraries! Please read the [contribution guidelines](./CONTRIBUTING.md) and the [developer guide](./DEVELOPING.md) to get started.
