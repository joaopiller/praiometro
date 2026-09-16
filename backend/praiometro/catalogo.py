"""Catálogo estático das praias (nomes, coordenadas) e estado atual (leituras)."""

from pathlib import Path

from .storage import ler_json


def carregar_catalogo(caminho: Path) -> dict[str, dict]:
    return ler_json(caminho)


def carregar_estado(estado_file: Path, catalogo_file: Path) -> dict[str, dict]:
    """Estado gerado pelo worker; se ainda não existir, usa só o catálogo."""
    try:
        return ler_json(estado_file)
    except FileNotFoundError:
        return carregar_catalogo(catalogo_file)
