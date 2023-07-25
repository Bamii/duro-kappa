#!/bin/sh

pnpm run --stream -r start:setup && cd /app && pnpm run --stream -r start:prod
