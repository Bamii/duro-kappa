from gplane/pnpm:node18 as base

workdir /app

copy . /app

workdir /app 

run pnpm i

run pnpm run build

workdir /app/shared/database

run npx prisma generate


ARG DATABASE_URL

arg QUEUE_CONNECTION_URL

env QUEUE_CONNECTION_URL $QUEUE_CONNECTION_URL

ENV DATABASE_URL $DATABASE_URL

env PORT 4000

expose 4000


from gplane/pnpm:node18 


COPY --from=base /app/shared package* pnpm* /app

copy --from=base /app/backend/admin /app/backend/queue /app/backend/doorman ./app/backend/

run pnpm i ts-node 

ARG DATABASE_URL

arg QUEUE_CONNECTION_URL

env QUEUE_CONNECTION_URL $QUEUE_CONNECTION_URL

ENV DATABASE_URL $DATABASE_URL


env PORT 4000

expose 4000

cmd ["npx", "ts-node", "/app/backend/doorman/src/index.ts"]




