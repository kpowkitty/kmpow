# Frontend test image. Built and run by tests/run.py; build context is the repo root.
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-slim

WORKDIR /repo
ENV CI=true

# Dependency layer first; --frozen-lockfile fails if yarn.lock is out of date.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive

COPY src src
COPY public public
COPY tests tests

# Arguments come from the selected config.
ENTRYPOINT ["node", "node_modules/jest/bin/jest.js", "--config", "tests/frontend/jest.config.js"]
