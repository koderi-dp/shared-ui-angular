# shared-ui — the registry and its showcase.

set shell := ["pwsh", "-NoLogo", "-Command"]

setup:
    npm install

dev:
    npm run dev

build:
    npm run build

test:
    npm test

lint:
    npm run lint

format:
    npm run format

check: build test lint
    npm run format:check

registry:build:
    npm run registry:build

registry:serve:
    npm run registry:serve
