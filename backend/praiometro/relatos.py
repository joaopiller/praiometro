"""Relatos rápidos dos banhistas ("está lotada", "tem água-viva"...).

Os relatos são opções fixas (nada de texto livre), valem por algumas horas e
somem sozinhos pelo índice TTL do MongoDB. Relatar o mesmo tipo funciona como
"eu também vi"; denúncias suficientes escondem o relato automaticamente.
"""

import math
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from itertools import pairwise

from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from .praias import id_da_praia

TIPOS = {
    "lotada": "Lotada",
    "tranquila": "Tranquila",
    "agua_viva": "Água-viva",
    "lixo": "Lixo na areia",
    "mar_agitado": "Mar agitado",
    "bandeira_vermelha": "Bandeira vermelha",
    "agua_turva": "Água turva",
    "agua_limpa": "Água limpa",
}

# não dá para relatar os dois de um par ao mesmo tempo
OPOSTOS = ({"lotada", "tranquila"}, {"agua_limpa", "agua_turva"})


class RelatoRecusadoError(Exception):
    def __init__(self, mensagem: str, status: int = 400):
        super().__init__(mensagem)
        self.status = status


@dataclass(frozen=True)
class RegrasRelatos:
    validade: timedelta = timedelta(hours=5)
    intervalo_mesmo_tipo: timedelta = timedelta(hours=1)
    # relatos valendo ao mesmo tempo, por pessoa
    maximo_ativos: int = 12
    raio_km: float = 2.0
    denuncias_para_ocultar: int = 3


def distancia_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = math.radians
    h = (
        math.sin(r(lat2 - lat1) / 2) ** 2
        + math.cos(r(lat1)) * math.cos(r(lat2)) * math.sin(r(lon2 - lon1) / 2) ** 2
    )
    return 2 * 6371 * math.asin(math.sqrt(h))


def distancia_ate_praia_km(local: tuple[float, float], praia: list[tuple[float, float]]) -> float:
    """Distância até a faixa da praia: a linha que liga os pontos de coleta, na ordem do litoral.

    Só a distância até os pontos deixaria de fora quem está no meio de uma praia comprida
    (os dois pontos da Reserva ficam a mais de 5 km um do outro).
    """
    if len(praia) == 1:
        return distancia_km(*local, *praia[0])
    # plano local em km, com origem em quem relata
    km_lon = 111.32 * math.cos(math.radians(local[0]))
    xy = [((lon - local[1]) * km_lon, (lat - local[0]) * 110.57) for lat, lon in praia]
    menor = math.inf
    for (x1, y1), (x2, y2) in pairwise(xy):
        dx, dy = x2 - x1, y2 - y1
        tamanho = dx * dx + dy * dy
        t = 0.0 if tamanho == 0 else max(0.0, min(1.0, -(x1 * dx + y1 * dy) / tamanho))
        menor = min(menor, math.hypot(x1 + t * dx, y1 + t * dy))
    return menor


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

    def migrar_para_praias(self, catalogo: dict[str, dict]) -> int:
        """Relatos e denúncias antigos eram por ponto de coleta; passam para a praia."""
        return sum(
            _juntar_por_praia(c, ("tipo", "user_id"), "criado_em", catalogo)
            for c in (self.relatos, self.denuncias)
        )

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
        tipos: str | list[str],
        local: tuple[float, float],
        praia: list[tuple[float, float]],
        agora: datetime | None = None,
    ) -> None:
        """Registra um ou vários relatos de uma vez.

        `praia` são as coordenadas dos pontos de coleta, na ordem do litoral; vale estar
        perto de qualquer lugar da faixa entre eles.
        """
        agora = agora or datetime.now(UTC)
        tipos = list(dict.fromkeys([tipos] if isinstance(tipos, str) else tipos))
        if not tipos or any(t not in TIPOS for t in tipos):
            raise RelatoRecusadoError("Tipo de relato inválido.")
        if any(par <= set(tipos) for par in OPOSTOS):
            raise RelatoRecusadoError("Escolha só uma opção de cada par (ex.: lotada ou tranquila).")
        if distancia_ate_praia_km(local, praia) > self.regras.raio_km:
            raise RelatoRecusadoError("Você precisa estar na praia para relatar.", status=403)

        novos = []
        for tipo in tipos:
            anterior = self.relatos.find_one({"praia_id": praia_id, "tipo": tipo, "user_id": user_id})
            # o mesmo na última hora já contou como "eu também vi"
            if not anterior or _utc(anterior["criado_em"]) <= agora - self.regras.intervalo_mesmo_tipo:
                novos.append(tipo)
        if not novos:
            return

        # os relatos somem ao expirar, então o limite é de relatos valendo ao mesmo tempo;
        # renovar um que já existe não soma
        ativos = {"user_id": user_id, "expira_em": {"$gt": agora}}
        total = self.relatos.count_documents(ativos)
        renovados = self.relatos.count_documents({**ativos, "praia_id": praia_id, "tipo": {"$in": novos}})
        if total - renovados + len(novos) > self.regras.maximo_ativos:
            raise RelatoRecusadoError(
                "Você já tem muitos relatos ativos. Tente de novo mais tarde.", status=429
            )

        for tipo in novos:
            self.relatos.update_one(
                {"praia_id": praia_id, "tipo": tipo, "user_id": user_id},
                {"$set": {"criado_em": agora, "expira_em": agora + self.regras.validade}},
                upsert=True,
            )

    def denunciar(self, praia_id: str, user_id: str, tipo: str, agora: datetime | None = None) -> None:
        agora = agora or datetime.now(UTC)
        if tipo not in TIPOS:
            raise RelatoRecusadoError("Tipo de relato inválido.")
        # só dá para contestar o que está no ar; senão contestações antecipadas esconderiam relatos futuros
        if not self.relatos.find_one({"praia_id": praia_id, "tipo": tipo, "expira_em": {"$gt": agora}}):
            raise RelatoRecusadoError("Esse relato não está mais ativo.", status=404)
        self.denuncias.update_one(
            {"praia_id": praia_id, "tipo": tipo, "user_id": user_id},
            {"$set": {"criado_em": agora, "expira_em": agora + self.regras.validade}},
            upsert=True,
        )


def _utc(valor: datetime) -> datetime:
    return valor if valor.tzinfo else valor.replace(tzinfo=UTC)


def _juntar_por_praia(
    colecao,
    chave: tuple[str, ...],
    campo_data: str,
    catalogo: dict[str, dict],
    docs: list[dict] | None = None,
) -> int:
    """Troca o código do ponto pelo id da praia. Se o usuário já tem o mesmo registro
    na praia (veio de outro ponto), fica o mais recente.

    Só mexe em códigos de ponto que estão no catálogo: ids de praia (IC, copacabana)
    ficam como estão.

    Seguro com mais de um processo rodando ao mesmo tempo: cada passo só mexe no
    documento se ele ainda estiver com o código antigo.
    """
    if docs is None:
        docs = list(colecao.find({"praia_id": {"$in": list(catalogo)}}).sort(campo_data, -1))
    movidos = 0
    for doc in docs:
        codigo = doc["praia_id"]
        if codigo not in catalogo:
            continue
        antigo = {"_id": doc["_id"], "praia_id": codigo}
        filtro = {"praia_id": id_da_praia(codigo, catalogo[codigo]), **{k: doc[k] for k in chave}}
        if colecao.find_one({**filtro, "_id": {"$ne": doc["_id"]}}):
            movidos += colecao.delete_one(antigo).deleted_count
            continue
        try:
            movidos += colecao.update_one(antigo, {"$set": {"praia_id": filtro["praia_id"]}}).modified_count
        except DuplicateKeyError:
            # outro processo levou um registro irmão para a praia no meio do caminho
            movidos += colecao.delete_one(antigo).deleted_count
    return movidos
