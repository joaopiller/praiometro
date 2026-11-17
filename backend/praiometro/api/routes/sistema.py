import time
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from starlette.concurrency import run_in_threadpool

from ... import __version__
from ...avaliacoes import RepositorioVotos
from ...coleta import situacao
from ..cache import CachePontos
from ..deps import get_cache, get_repo
from ..schemas import Health

router = APIRouter(tags=["sistema"])


@router.get("/health", response_model=Health, summary="Verifica se a API está no ar")
async def health(
    request: Request, cache: CachePontos = Depends(get_cache), repo: RepositorioVotos = Depends(get_repo)
):
    ping = request.app.state.ping_mongo
    if time.monotonic() - ping["em"] > 10:
        ping["ok"] = await run_in_threadpool(repo.ping)
        ping["em"] = time.monotonic()
    dados = cache.dados
    leituras = [p.get("leitura_atual") or {} for p in dados.values()]
    # sem o arquivo de estado a API responde só com o catálogo: a coleta ainda não rodou
    try:
        gravado = datetime.fromtimestamp(cache.arquivo.stat().st_mtime, UTC).isoformat(timespec="seconds")
    except OSError:
        gravado = None
    return Health(
        status="ok" if dados else "degradado",
        versao=__version__,
        pontos=len(dados),
        mongo=ping["ok"],
        coleta_embutida=request.app.state.settings.coletor_embutido,
        ultima_coleta=gravado,
        pontos_com_leitura=sum(1 for leitura in leituras if leitura.get("timestamp")),
        pontos_com_boletim=sum(1 for leitura in leituras if leitura.get("balneabilidade") is not None),
        fontes=situacao.fontes(),
    )


@router.post("/notificar-atualizacao", summary="Força a recarga do estado (somente localhost)")
def notificar_atualizacao(request: Request, cache: CachePontos = Depends(get_cache)):
    host = request.client.host if request.client else ""
    if host not in ("127.0.0.1", "::1", "localhost", "testclient"):
        raise HTTPException(status_code=403, detail="Acesso negado")
    cache.recarregar(forcar=True)
    return {"status": "Atualizado", "pontos": len(cache.dados)}
