#!/bin/sh

pnpm --stream -r start:setup && cd /app && pnpm run start:prod
