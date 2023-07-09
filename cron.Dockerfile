from node:18-alpine3.17 

workdir /app

run npm install -g pnpm

COPY ./shared /app/shared

copy ./backend/jobs /app/backend/jobs

copy ./package* /app/pnpm* /app/

workdir /app

run npx pnpm i

run npx pnpm run build

run npx pnpm i ts-node -w

workdir /app/shared/database

run npx prisma generate

ARG DATABASE_URL

arg QUEUE_CONNECTION_URL

env QUEUE_CONNECTION_URL $QUEUE_CONNECTION_URL

ENV DATABASE_URL $DATABASE_URL


env PORT 4000

expose 4000

cmd ["npx", "ts-node", "/app/backend/jobs/src/index.ts"]




