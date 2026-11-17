"""Worker: coleta horária dos dados e snapshot das médias de avaliação.

praiometro-worker           roda continuamente
praiometro-worker --once    executa uma vez e sai

Com COLETOR_EMBUTIDO=true a API roda estas mesmas tarefas dentro dela (ver api/app.py).
"""

import argparse
import logging
import threading

import schedule

from .avaliacoes import RepositorioVotos, gravar_snapshot_medias
from .catalogo import carregar_catalogo
from .coleta.atualizador import atualizar_historico, atualizar_regiao, executar_coleta
from .config import Settings, configurar_logging, get_settings
from .db import criar_colecao_votos
from .relatos import RepositorioRelatos

log = logging.getLogger("praiometro.worker")


def _seguro(nome, func):
    def executar():
        try:
            func()
        except Exception:
            log.exception("Tarefa '%s' falhou", nome)

    return executar


def rodar(settings: Settings, uma_vez: bool = False, parar: threading.Event | None = None) -> None:
    """Executa as tarefas agora e depois no horário de cada uma, até `parar` ser acionado."""
    parar = parar or threading.Event()
    repo = RepositorioVotos(criar_colecao_votos(settings))
    relatos = RepositorioRelatos(repo.colecao.database)

    coleta = _seguro("coleta", lambda: executar_coleta(settings))
    medias = _seguro("médias", lambda: gravar_snapshot_medias(repo, settings.estado_file))
    regiao = _seguro("maré e sol", lambda: atualizar_regiao(settings))
    historico = _seguro("histórico", lambda: atualizar_historico(settings))

    # votos e relatos antigos eram por ponto de coleta; aqui roda num processo só
    catalogo = carregar_catalogo(settings.catalogo_file)
    praias = _seguro(
        "migração para praias", lambda: [r.migrar_para_praias(catalogo) for r in (repo, relatos)]
    )

    # a coleta vem primeiro: é ela que põe as praias no ar
    for tarefa in (coleta, regiao, praias, historico, medias):
        if parar.is_set():
            return
        tarefa()
    if uma_vez:
        return

    agenda = schedule.Scheduler()
    agenda.every().hour.at(":01").do(coleta)
    agenda.every().hour.at(":05").do(regiao)
    agenda.every(6).hours.do(historico)
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
