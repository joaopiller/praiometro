"""Regras e persistência das avaliações (votos) dos usuários."""

import logging
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from typing import Any

from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError

from .praias import id_da_praia
from .storage import atualizar_json

log = logging.getLogger(__name__)

CRITERIOS = ("limpeza", "acessibilidade", "infraestrutura", "seguranca", "tranquilidade")


@dataclass(frozen=True)
class ResumoAvaliacao:
    medias: dict[str, float]
    total: int

    @property
    def estrelas(self) -> dict[str, float]:
        """Médias arredondadas para a meia estrela mais próxima."""
        return {c: arredondar_meia(v) for c, v in self.medias.items()}

    @property
    def nota_geral(self) -> float | None:
        if not self.medias:
            return None
        return round(sum(self.medias.values()) / len(self.medias), 2)


def arredondar_meia(valor: float) -> float:
    return max(0.5, min(5.0, round(valor * 2) / 2))


@dataclass(frozen=True)
class ResultadoVoto:
    registrado: bool
    atualizado: bool = False
    pode_votar_em: date | None = None


def _para_datetime(valor: Any) -> datetime:
    dt = valor if isinstance(valor, datetime) else datetime.fromisoformat(str(valor))
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


class RepositorioVotos:
    def __init__(self, colecao: Collection):
        self.colecao = colecao

    def garantir_indices(self) -> None:
        self.colecao.create_index([("praia_id", 1), ("user_id", 1)], unique=True)

    def migrar_para_praias(self) -> int:
        """Votos antigos eram por ponto de coleta; passam para a praia.

        Quem avaliou dois pontos da mesma praia fica com a avaliação mais recente.
        """
        from .relatos import _juntar_por_praia

        movidos = _juntar_por_praia(self.colecao, ("user_id",), "timestamp")
        if movidos:
            log.info("%d avaliações passaram de ponto para praia", movidos)
        return movidos

    def ping(self) -> bool:
        try:
            self.colecao.database.client.admin.command("ping")
            return True
        except Exception:
            return False

    def _agregar(self, filtro: dict) -> dict[str, ResumoAvaliacao]:
        grupo: dict[str, Any] = {"_id": "$praia_id", "total": {"$sum": 1}}
        grupo.update({c: {"$avg": f"$votos.{c}"} for c in CRITERIOS})
        resumos = {}
        for r in self.colecao.aggregate([{"$match": filtro}, {"$group": grupo}]):
            medias = {c: round(r[c], 2) for c in CRITERIOS if r.get(c) is not None}
            if medias:
                resumos[r["_id"]] = ResumoAvaliacao(medias=medias, total=r["total"])
        return resumos

    def resumo(self, praia_id: str) -> ResumoAvaliacao | None:
        return self._agregar({"praia_id": praia_id}).get(praia_id)

    def resumos(self) -> dict[str, ResumoAvaliacao]:
        return self._agregar({})

    def registrar(
        self,
        praia_id: str,
        user_id: str,
        votos: dict[str, float],
        intervalo: timedelta,
        agora: datetime | None = None,
    ) -> ResultadoVoto:
        """Grava ou atualiza o voto. Com `intervalo` > 0, bloqueia novos votos até ele passar."""
        agora = agora or datetime.now(UTC)
        antigo = self.colecao.find_one({"praia_id": praia_id, "user_id": user_id})
        if antigo and intervalo > timedelta(0):
            liberado_em = _para_datetime(antigo["timestamp"]) + intervalo
            if agora < liberado_em:
                return ResultadoVoto(registrado=False, pode_votar_em=liberado_em.date())
        try:
            self.colecao.update_one(
                {"praia_id": praia_id, "user_id": user_id},
                {"$set": {"votos": votos, "timestamp": agora.isoformat()}},
                upsert=True,
            )
        except DuplicateKeyError:
            # requisição concorrente do mesmo usuário
            return ResultadoVoto(registrado=False)
        return ResultadoVoto(registrado=True, atualizado=antigo is not None)


def gravar_snapshot_medias(repo: RepositorioVotos, estado_file) -> int:
    """Copia as médias para o estado, usado como fallback se o Mongo cair."""
    resumos = repo.resumos()

    def alterar(estado: dict) -> dict:
        for codigo, ponto in estado.items():
            r = resumos.get(id_da_praia(codigo, ponto))
            if r:
                ponto["avaliacao_media"] = r.estrelas
                ponto["total_avaliacoes"] = r.total
        return estado

    atualizar_json(estado_file, alterar)
    log.info("Snapshot de médias gravado para %d praias", len(resumos))
    return len(resumos)
