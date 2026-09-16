"""Leitura/escrita de JSON com escrita atômica e trava entre processos."""

import json
import logging
import os
import tempfile
import time
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)

LOCK_ABANDONADO_APOS = 120  # segundos


def ler_json(caminho: Path) -> Any:
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def salvar_json_atomico(dados: Any, caminho: Path) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=f".{caminho.stem}-", suffix=".tmp", dir=caminho.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(dados, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, caminho)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise


@contextmanager
def trava(caminho: Path, timeout: float = 60.0) -> Iterator[None]:
    lock = caminho.with_name(caminho.name + ".lock")
    lock.parent.mkdir(parents=True, exist_ok=True)
    inicio = time.monotonic()
    while True:
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(fd, str(os.getpid()).encode())
            os.close(fd)
            break
        except FileExistsError:
            try:
                if time.time() - lock.stat().st_mtime > LOCK_ABANDONADO_APOS:
                    log.warning("Removendo trava abandonada %s", lock)
                    lock.unlink(missing_ok=True)
                    continue
            except FileNotFoundError:
                continue
            if time.monotonic() - inicio > timeout:
                raise TimeoutError(f"Não foi possível travar {caminho}") from None
            time.sleep(0.1)
    try:
        yield
    finally:
        lock.unlink(missing_ok=True)


def atualizar_json(caminho: Path, alterar: Callable[[dict], dict]) -> dict:
    """Lê → altera → grava, tudo sob a mesma trava (read-modify-write seguro)."""
    with trava(caminho):
        try:
            atual = ler_json(caminho)
        except FileNotFoundError:
            atual = {}
        novo = alterar(atual)
        salvar_json_atomico(novo, caminho)
        return novo
