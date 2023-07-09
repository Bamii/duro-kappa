from node:18-alpine3.17 as base

workdir /app

run npm install -g pnpm

COPY ./shared /app/shared

copy ./backend/admin /app/backend/admin

copy ./backend/queue /app/backend/queue

copy ./backend/doorman /app/backend/doorman

copy ./package* /app/pnpm* /app/setup.sh /app/

workdir /app

run pnpm i --force ts-node -w

run npx pnpm i --force

run npx pnpm run build

workdir /app/shared/database

run npx prisma generate

ARG DATABASE_URL

arg QUEUE_CONNECTION_URL

env QUEUE_CONNECTION_URL $QUEUE_CONNECTION_URL

ENV DATABASE_URL $DATABASE_URL

workdir /app

env PORT 4000

expose 4000

cmd ["npx", "pnpm", "start"]





