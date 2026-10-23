# shared-ui — the @koderi-dp/ui library and its showcase.

set shell := ["pwsh", "-NoLogo", "-Command"]

setup:
    npm install

dev:
    npm run dev

build:
    npm run build

build-lib:
    npm run build:lib

test:
    npm test

typecheck:
    npm run typecheck

lint:
    npm run lint

format:
    npm run format

check: typecheck build build-lib test lint
    npm run format:check
