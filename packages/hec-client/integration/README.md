## Run integration tests locally

1. Start docker-compose

```sh-session
$ cd integration
$ docker-compose up -d
```

Wait for Splunk to be running (you can check by accessing the web UI at [http://localhost:8000/](http://localhost:8000/).

2. Run tests

```sh-session
$ yarn test:integration --watch
```
