# Prometheus Scraper

A simple docker image that uses the `@splunkdlt/prometheus-scraper` package to periodically scrape metrics from a prometheus endpoint and forwards them to a Splunk HTTP Event Collector.

# Example Usage

Example usage in docker-compose:

```yaml
services:
    prometheus-scraper:
        image: ghcr.io/splunkdlt/prometheus-scraper:latest
        environment:
            - PROMETHEUS_METRICS_URL=http://some.service.com:8080/debug/metrics/prometheus
            - OUTPUT_HEC_URL=https://my.hec.splunk.com:8088
            - OUTPUT_HEC_TOKEN=11111111-1111-1111-1111-1111111111111
            - OUTPUT_METRICS_NAME_PREFIX=my.service
            - OUTPUT_METRICS_SOURCETYPE=myservice:metrics
            - OUTPUT_METRICS_SOURCE=myservice:metrics:prometheus
```
