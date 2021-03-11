FROM node:12-alpine as builder

WORKDIR /build
# Copy the full workspace
COPY . ./
RUN yarn install --frozen-lockfile && yarn build

FROM node:12-alpine

LABEL org.opencontainers.image.source https://github.com/splunk/dlt-connect-libs

WORKDIR /app
COPY --from=builder /build/docker/prometheus-scraper-standalone/dist /promscraper

ENV NODE_ENV production
ENTRYPOINT [ "node", "/promscraper/index.js" ]
