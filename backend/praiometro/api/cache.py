"""Cache em memória dos arquivos JSON gerados pelo worker."""

import logging
import threading
import time
from collections.abc import Callable
from pathlib import Path
from typing import Any

from ..catalogo import carregar_catalogo, carregar_estado
from ..storage import ler_json

log = logging.getLogger(__name__)


class CacheJson:
    """Relê o arquivo quando o mtime muda (checado no máximo a cada `intervalo` s).

    Se a leitura falhar, mantém o conteúdo anterior; se ainda não houver nada, usa `reserva`.
    """

    def __init__(
        self,
        arquivo: Path,
        carregar: Callable[[], Any] | None = None,
        reserva: Callable[[], Any] | None = None,
        intervalo: float = 5.0,
    ):
        self.arquivo = arquivo
        self.carregar = carregar or (lambda: ler_json(arquivo))
        self.reserva = reserva or dict
        self.intervalo = intervalo
        self._dados: Any = {}
        self._mtime: float | None = None
        self._conferido_em = 0.0
        self._lock = threading.Lock()
        self.versao = 0

    def _mtime_atual(self) -> float | None:
        try:
            return self.arquivo.stat().st_mtime
        except OSError:
            return None

    def recarregar(self, forcar: bool = False) -> None:
        agora = time.monotonic()
        if not forcar and self._dados and agora - self._conferido_em < self.intervalo:
            return
        with self._lock:
            self._conferido_em = agora
            mtime = self._mtime_atual()
            if not forcar and self._dados and mtime == self._mtime:
                return
            try:
                self._dados = (self.carregar() if mtime is not None else None) or self.reserva()
                self._mtime = mtime
                self.versao += 1
            except Exception:
                log.exception("Erro ao recarregar %s", self.arquivo)
                if not self._dados:
                    try:
                        self._dados = self.reserva()
                        self.versao += 1
                    except Exception:
                        log.exception("Reserva de %s também indisponível", self.arquivo)

    @property
    def dados(self) -> Any:
        self.recarregar()
        return self._dados


class CachePontos(CacheJson):
    def __init__(self, estado_file: Path, catalogo_file: Path, intervalo: float = 5.0):
        super().__init__(
            estado_file,
            carregar=lambda: carregar_estado(estado_file, catalogo_file),
            reserva=lambda: carregar_catalogo(catalogo_file),
            intervalo=intervalo,
        )
