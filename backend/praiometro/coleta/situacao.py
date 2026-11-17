"""Como foi a última tentativa em cada fonte de dados.

Fica na memória do processo que coleta; a API mostra no /health quando a coleta roda
dentro dela.
"""

_fontes: dict[str, str] = {}


def registrar(fonte: str, erro: object = None) -> None:
    _fontes[fonte] = "ok" if erro is None else f"erro: {erro}"[:200]


def fontes() -> dict[str, str]:
    return dict(_fontes)
