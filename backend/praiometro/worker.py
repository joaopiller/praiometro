"""Worker: coleta horária dos dados e snapshot das médias de avaliação.

praiometro-worker           roda continuamente
praiometro-worker --once    executa uma vez e sai
"""

import argparse
import logging
import time

import schedule

from .avaliacoes import RepositorioVotos, gravar_snapshot_medias
from .coleta.atualizador import atualizar_historico, atualizar_regiao, executar_coleta
from .config import configurar_logging, get_settings
from .db import criar_colecao_votos

log = logging.getLogger("praiometro.worker")


def _seguro(nome, func):
    def executar():
        try:
            func()
        except Exception:
            log.exception("Tarefa '%s' falhou", nome)

    return executar


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--once", action="store_true", help="executa as tarefas uma vez e sai")
    args = parser.parse_args(argv)

    settings = get_settings()
    configurar_logging(settings.log_level)
    repo = RepositorioVotos(criar_colecao_votos(settings))

    coleta = _seguro("coleta", lambda: executar_coleta(settings))
    medias = _seguro("médias", lambda: gravar_snapshot_medias(repo, settings.estado_file))
    regiao = _seguro("maré e sol", lambda: atualizar_regiao(settings))
    historico = _seguro("histórico", lambda: atualizar_historico(settings))

    for tarefa in (coleta, regiao, historico, medias):
        tarefa()
    if args.once:
        return

    schedule.every().hour.at(":01").do(coleta)
    schedule.every().hour.at(":05").do(regiao)
    schedule.every(6).hours.do(historico)
    schedule.every(15).minutes.do(medias)
    log.info("Worker rodando. Ctrl+C para sair.")
    while True:
        schedule.run_pending()
        time.sleep(15)


if __name__ == "__main__":
    main()
