# syntax=docker/dockerfile:1
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY pyproject.toml ./
COPY praiometro ./praiometro
RUN pip install .

# Usuário sem privilégios
RUN useradd --create-home --uid 1000 praiometro && mkdir -p /app/var && chown praiometro /app/var
USER praiometro

ENV DATA_DIR=/app/var
VOLUME ["/app/var"]
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.environ.get('PORT', '8000') + '/health')" || exit 1

CMD ["praiometro-api"]
