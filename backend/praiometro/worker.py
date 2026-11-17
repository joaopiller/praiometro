"""Worker: coleta horária dos dados e snapshot das médias de avaliação.

praiometro-worker           roda continuamente
praiometro-worker --once    executa uma vez e sai

Com COLETOR_EMBUTIDO=true a API roda estas mesmas tarefas dentro dela (ver api/app.py).
"""

import argparse
import logging
import threading
import time
from pathlib import Path

import schedule

from .avaliacoes import RepositorioVotos, gravar_snapshot_medias
from .catalogo import carregar_catalogo
from .coleta.atualizador import atualizar_historico, atualizar_regiao, executar_coleta
from .config import Settings, configurar_logging, get_settings
from .copia import CopiaDosArquivos
from .db import criar_colecao_votos
from .relatos import RepositorioRelatos

log = logging.getLogger("praiometro.worker")


HISTORICO_A_CADA = 6  # horas


def _recente(arquivo: Path, horas: float) -> bool:
    try:
        return time.time() - arquivo.stat().st_mtime < horas * 3600
    except OSError:
        return False


def _seguro(nome, func, depois=None):
    def executar():
        try:
            func()
            if depois:
                depois()
        except Exception:
            log.exception("Tarefa '%s' falhou", nome)

    return executar


def copia_dos_arquivos(settings: Settings, banco) -> CopiaDosArquivos:
    arquivos = [settings.estado_file, settings.historico_file, settings.regiao_file]
    return CopiaDosArquivos(banco["arquivos"], arquivos)


def rodar(settings: Settings, uma_vez: bool = False, parar: threading.Event | None = None) -> None:
    """Executa as tarefas agora e depois no horário de cada uma, até `parar` ser acionado."""
    parar = parar or threading.Event()
    repo = RepositorioVotos(criar_colecao_votos(settings))
    relatos = RepositorioRelatos(repo.colecao.database)

    # sem disco permanente, cada arquivo gerado vai também para o banco
    copia = copia_dos_arquivos(settings, repo.colecao.database)
    guardar = copia.guardar if settings.coletor_embutido else None

    coleta = _seguro("coleta", lambda: executar_coleta(settings), guardar)
    medias = _seguro("médias", lambda: gravar_snapshot_medias(repo, settings.estado_file))
    regiao = _seguro("maré e sol", lambda: atualizar_regiao(settings), guardar)
    historico = _seguro("histórico", lambda: atualizar_historico(settings), guardar)

    # votos e relatos antigos eram por ponto de coleta; aqui roda num processo só
    catalogo = carregar_catalogo(settings.catalogo_file)
    praias = _seguro(
        "migração para praias", lambda: [r.migrar_para_praias(catalogo) for r in (repo, relatos)]
    )

    # a coleta vem primeiro: é ela que põe as praias no ar
    iniciais = [coleta, regiao, praias, historico, medias]
    if _recente(settings.historico_file, HISTORICO_A_CADA):
        # reler os boletins do ano inteiro é a parte mais pesada; se o arquivo voltou do banco
        # ainda novo, fica para o próximo horário
        iniciais.remove(historico)
    for tarefa in iniciais:
        if parar.is_set():
            return
        tarefa()
    if uma_vez:
        return

    agenda = schedule.Scheduler()
    agenda.every().hour.at(":01").do(coleta)
    agenda.every().hour.at(":05").do(regiao)
    agenda.every(HISTORICO_A_CADA).hours.do(historico)
    agenda.every(15).minutes.do(medias)
    log.info("Coleta agendada.")
    while not parar.wait(15):
        agenda.run_pending()


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--once", action="store_true", help="executa as tarefas uma vez e sai")
    args = parser.parse_args(argv)

    settings = get_settings()
    configurar_logging(settings.log_level)
    rodar(settings, uma_vez=args.once)


if __name__ == "__main__":
    main()
