from node:18-alpine3.17

workdir /app

copy ./apps/provider/ /app

workdir /app 

run npm i

arg NEXT_PUBLIC_API_URL 

env NEXT_PUBLIC_API_URL $NEXT_PUBLIC_API_URL

workdir /app/provider

run npm run build

env PORT 5000

expose 5000

cmd ["npm", "run", "start"]


