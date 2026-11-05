# Backend test image. Built and run by tests/run.py; build context is the repo root.
ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION}-slim

# psycopg2 (non-binary) compiles against libpq.
RUN apt-get update \
 && apt-get install -y --no-install-recommends gcc libpq-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /repo

# Dependency layers first so they stay cached until requirements change.
COPY backend/.requirements.txt backend/.requirements.txt
COPY tests/requirements.txt tests/requirements.txt
RUN pip install --no-cache-dir -r backend/.requirements.txt -r tests/requirements.txt

COPY backend backend
COPY tests tests

# pytest.ini lives in tests/; arguments come from the selected config.
WORKDIR /repo/tests
ENTRYPOINT ["pytest"]
