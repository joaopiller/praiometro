"""Teste de carga simples da API.

Uso:  python scripts/benchmark.py [url] [--requisicoes 2000] [--concorrencia 50]
"""

import argparse
import asyncio
import statistics
import time

import httpx

ROTAS = ["/pontos", "/pontos/GR000", "/pontos/IC003/avaliacao", "/health"]


async def medir(cliente: httpx.AsyncClient, rota: str, total: int, concorrencia: int):
    sem = asyncio.Semaphore(concorrencia)
    tempos: list[float] = []
    erros = 0

    async def uma():
        nonlocal erros
        async with sem:
            inicio = time.perf_counter()
            try:
                r = await cliente.get(rota)
                if r.status_code != 200:
                    erros += 1
            except httpx.HTTPError:
                erros += 1
            tempos.append((time.perf_counter() - inicio) * 1000)

    inicio = time.perf_counter()
    await asyncio.gather(*(uma() for _ in range(total)))
    duracao = time.perf_counter() - inicio
    tempos.sort()
    p = lambda q: tempos[int(len(tempos) * q) - 1]  # noqa: E731
    print(
        f"{rota:<26} {total / duracao:7.0f} req/s   "
        f"p50 {statistics.median(tempos):6.1f} ms   p95 {p(0.95):6.1f} ms   "
        f"p99 {p(0.99):6.1f} ms   erros {erros}"
    )


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url", nargs="?", default="http://localhost:8000")
    parser.add_argument("--requisicoes", type=int, default=2000)
    parser.add_argument("--concorrencia", type=int, default=50)
    args = parser.parse_args()
    limites = httpx.Limits(max_connections=args.concorrencia)
    async with httpx.AsyncClient(base_url=args.url, limits=limites, timeout=30) as cliente:
        for rota in ROTAS:
            await medir(cliente, rota, args.requisicoes, args.concorrencia)


if __name__ == "__main__":
    asyncio.run(main())
