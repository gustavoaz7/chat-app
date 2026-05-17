# Local Development

## Start local infrastructure

Run:

`docker compose -f infra/docker-compose.yml up -d`

## Install workspace dependencies

Run:

`pnpm install`

## Start the web app

Run:

`pnpm --filter @apps/web dev`

The frontend dev server should start on `http://127.0.0.1:5173`.

## Run the current frontend checks

Component test:

`pnpm --filter @apps/web test`

Browser smoke test:

`pnpm --filter @apps/web e2e`

## Current first-slice verification

The first vertical slice is healthy when all of the following are true:

- the seeded conversation renders in the browser
- sending a message appends it to the visible conversation
- the browser smoke test passes against the local preview server
