"""Cópia no MongoDB dos arquivos que a coleta gera.

Em hospedagens sem disco permanente o serviço volta do zero a cada início. Com a cópia, ele
já sobe com os dados da última coleta e o histórico, em vez de responder vazio até a próxima.
"""

import logging
import os
import zlib
from pathlib import Path

from pymongo.collection import Collection

log = logging.getLogger(__name__)


class CopiaDosArquivos:
    def __init__(self, colecao: Collection, arquivos: list[Path]):
        self.colecao = colecao
        self.arquivos = arquivos
        self._guardados: dict[str, float] = {}

    def restaurar(self) -> list[str]:
        """Traz do banco os arquivos que não existem no disco."""
        trazidos = []
        for caminho in self.arquivos:
            if caminho.exists():
                continue
            doc = self.colecao.find_one({"_id": caminho.name})
            if not doc:
                continue
            caminho.parent.mkdir(parents=True, exist_ok=True)
            parcial = caminho.with_name(caminho.name + ".parcial")
            parcial.write_bytes(zlib.decompress(doc["conteudo"]))
            # a data de gravação original é a que conta como "última coleta"
            os.utime(parcial, (doc["gravado_em"], doc["gravado_em"]))
            os.replace(parcial, caminho)
            self._guardados[caminho.name] = caminho.stat().st_mtime
            trazidos.append(caminho.name)
        return trazidos

    def guardar(self) -> list[str]:
        """Manda para o banco os arquivos que mudaram desde a última cópia."""
        enviados = []
        for caminho in self.arquivos:
            try:
                gravado_em = caminho.stat().st_mtime
                if self._guardados.get(caminho.name) == gravado_em:
                    continue
                conteudo = caminho.read_bytes()
            except OSError:
                continue
            self.colecao.replace_one(
                {"_id": caminho.name},
                {"_id": caminho.name, "conteudo": zlib.compress(conteudo), "gravado_em": gravado_em},
                upsert=True,
            )
            self._guardados[caminho.name] = gravado_em
            enviados.append(caminho.name)
        return enviados
