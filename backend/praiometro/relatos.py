"""Relatos rápidos dos banhistas ("está lotada", "tem água-viva"...).

Os relatos são opções fixas (nada de texto livre), valem por algumas horas e
somem sozinhos pelo índice TTL do MongoDB. Relatar o mesmo tipo funciona como
"eu também vi"; denúncias suficientes escondem o relato automaticamente.
"""

import math
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from pymongo.database import Database

TIPOS = {
    "lotada": "Lotada",
    "tranquila": "Tranquila",
    "agua_viva": "Água-viva",
    "lixo": "Lixo na areia",
    "mar_agitado": "Mar agitado",
    "bandeira_vermelha": "Bandeira vermelha",
    "agua_turva": "Água turva",
}


class RelatoRecusadoError(Exception):
    def __init__(self, mensagem: str, status: int = 400):
        super().__init__(mensagem)
        self.status = status


@dataclass(frozen=True)
class RegrasRelatos:
    validade: timedelta = timedelta(hours=5)
    intervalo_mesmo_tipo: timedelta = timedelta(hours=1)
    maximo_por_dia: int = 5
    raio_km: float = 2.0
    denuncias_para_ocultar: int = 3


def distancia_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = math.radians
    h = (
        math.sin(r(lat2 - lat1) / 2) ** 2
        + math.cos(r(lat1)) * math.cos(r(lat2)) * math.sin(r(lon2 - lon1) / 2) ** 2
    )
    return 2 * 6371 * math.asin(math.sqrt(h))


class RepositorioRelatos:
    def __init__(self, db: Database, regras: RegrasRelatos | None = None):
        self.relatos = db["relatos"]
        self.denuncias = db["relatos_denuncias"]
        self.regras = regras or RegrasRelatos()

    def garantir_indices(self) -> None:
        for colecao in (self.relatos, self.denuncias):
            colecao.create_index("expira_em", expireAfterSeconds=0)
            colecao.create_index([("praia_id", 1), ("tipo", 1), ("user_id", 1)], unique=True)
        self.relatos.create_index([("user_id", 1), ("criado_em", -1)])

    def listar(self, praia_id: str, agora: datetime | None = None) -> list[dict]:
        """Relatos ativos agrupados por tipo, do mais confirmado para o menos."""
        agora = agora or datetime.now(UTC)
        ativos = {"praia_id": praia_id, "expira_em": {"$gt": agora}}
        grupos = self.relatos.aggregate(
            [
                {"$match": ativos},
                {
                    "$group": {
                        "_id": "$tipo",
                        "confirmacoes": {"$sum": 1},
                        "ultimo_em": {"$max": "$criado_em"},
                    }
                },
            ]
        )
        denuncias: dict[str, int] = {}
        for d in self.denuncias.aggregate(
            [{"$match": ativos}, {"$group": {"_id": "$tipo", "total": {"$sum": 1}}}]
        ):
            denuncias[d["_id"]] = d["total"]

        resultado = []
        for g in grupos:
            negativas = denuncias.get(g["_id"], 0)
            if negativas >= self.regras.denuncias_para_ocultar and negativas >= g["confirmacoes"]:
                continue
            ultimo = g["ultimo_em"]
            resultado.append(
                {
                    "tipo": g["_id"],
                    "rotulo": TIPOS.get(g["_id"], g["_id"]),
                    "confirmacoes": g["confirmacoes"],
                    "ultimo_em": (ultimo if ultimo.tzinfo else ultimo.replace(tzinfo=UTC)).isoformat(),
                }
            )
        resultado.sort(key=lambda r: r["ultimo_em"], reverse=True)
        resultado.sort(key=lambda r: r["confirmacoes"], reverse=True)
        return resultado

    def registrar(
        self,
        praia_id: str,
        user_id: str,
        tipo: str,
        local: tuple[float, float],
        praia: tuple[float, float],
        agora: datetime | None = None,
    ) -> None:
        agora = agora or datetime.now(UTC)
        if tipo not in TIPOS:
            raise RelatoRecusadoError("Tipo de relato inválido.")
        if distancia_km(*local, *praia) > self.regras.raio_km:
            raise RelatoRecusadoError("Você precisa estar na praia para relatar.", status=403)

        anterior = self.relatos.find_one({"praia_id": praia_id, "tipo": tipo, "user_id": user_id})
        if anterior and _utc(anterior["criado_em"]) > agora - self.regras.intervalo_mesmo_tipo:
            return  # já contou como "eu também vi" na última hora

        hoje = self.relatos.count_documents(
            {"user_id": user_id, "criado_em": {"$gt": agora - timedelta(days=1)}}
        )
        if hoje >= self.regras.maximo_por_dia:
            raise RelatoRecusadoError("Você atingiu o limite de relatos de hoje.", status=429)

        self.relatos.update_one(
            {"praia_id": praia_id, "tipo": tipo, "user_id": user_id},
            {"$set": {"criado_em": agora, "expira_em": agora + self.regras.validade}},
            upsert=True,
        )

    def denunciar(self, praia_id: str, user_id: str, tipo: str, agora: datetime | None = None) -> None:
        agora = agora or datetime.now(UTC)
        if tipo not in TIPOS:
            raise RelatoRecusadoError("Tipo de relato inválido.")
        self.denuncias.update_one(
            {"praia_id": praia_id, "tipo": tipo, "user_id": user_id},
            {"$set": {"criado_em": agora, "expira_em": agora + self.regras.validade}},
            upsert=True,
        )


def _utc(valor: datetime) -> datetime:
    return valor if valor.tzinfo else valor.replace(tzinfo=UTC)
