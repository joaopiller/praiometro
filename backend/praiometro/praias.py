"""Praias: os pontos de coleta do INEA agrupados pela praia a que pertencem.

O código de cada ponto começa com o da praia (IC003 e IC00 são de Icaraí), então
a praia é identificada pelas duas primeiras letras. As avaliações e os relatos
são da praia; a balneabilidade continua sendo de cada ponto.
"""

import json
from functools import cache
from pathlib import Path
from typing import Literal

Situacao = Literal["propria", "impropria", "parcial", "sem_dados"]


# pin de cada praia, no meio da faixa de areia (gerado por scripts/centro_das_praias.py)
CENTROS_FILE = Path(__file__).parent / "dados" / "centro_das_praias.json"


@cache
def centros() -> dict[str, list[float]]:
    try:
        return json.loads(CENTROS_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}


def id_da_praia(codigo: str) -> str:
    return codigo[:2].upper()


def _local(info: dict) -> str:
    return next((ref.strip() for ref in info.get("specific_location") or [] if ref.strip()), "")


def situacao(valores: list[bool | None]) -> Situacao:
    com_dados = [v for v in valores if v is not None]
    if not com_dados:
        return "sem_dados"
    if all(com_dados):
        return "propria"
    if not any(com_dados):
        return "impropria"
    return "parcial"


def agrupar(pontos: dict[str, dict]) -> dict[str, dict]:
    """Praias na ordem do litoral, cada uma com seus pontos na ordem do catálogo.

    O ponto principal (de onde vêm clima e mar) é o que não tem referência
    específica; se todos tiverem, o do meio da praia.
    """
    praias: dict[str, dict] = {}
    for codigo, info in pontos.items():
        praia = praias.setdefault(
            id_da_praia(codigo),
            {
                "id": id_da_praia(codigo),
                "ordem": len(praias),
                "nome": (info.get("nome") or [""])[0],
                "pontos": [],
            },
        )
        praia["pontos"].append(codigo)
    for praia in praias.values():
        sem_referencia = [c for c in praia["pontos"] if not _local(pontos[c])]
        meio = praia["pontos"][len(praia["pontos"]) // 2]
        praia["principal"] = sem_referencia[0] if sem_referencia else meio
    return praias


def resumir(praia: dict, pontos: dict[str, dict]) -> dict:
    """Dados da praia para a API: situação geral e o estado de cada ponto."""
    itens = []
    for codigo in praia["pontos"]:
        info = pontos[codigo]
        leitura = info.get("leitura_atual") or {}
        itens.append(
            {
                "codigo": codigo,
                "local": _local(info),
                "coordenadas": info.get("coordenadas_decimais"),
                "coordenadas_terra": info.get("coordenadas_terra_decimais"),
                "balneabilidade": leitura.get("balneabilidade"),
                "balneabilidade_data": leitura.get("balneabilidade_data"),
            }
        )
    valores = [p["balneabilidade"] for p in itens]
    datas = [p["balneabilidade_data"] for p in itens if p["balneabilidade_data"]]
    principal = pontos[praia["principal"]]
    return {
        "id": praia["id"],
        "ordem": praia["ordem"],
        "nome": praia["nome"],
        "principal": praia["principal"],
        "centro": centros().get(praia["id"]) or principal.get("coordenadas_terra_decimais"),
        "mar": principal.get("mar"),
        "situacao": situacao(valores),
        "pontos_proprios": sum(1 for v in valores if v is True),
        "pontos_com_dados": sum(1 for v in valores if v is not None),
        "balneabilidade_data": max(datas, default=None),
        "ultima_leitura": (principal.get("leitura_atual") or {}).get("timestamp"),
        "pontos": itens,
    }
