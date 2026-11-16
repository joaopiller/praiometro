"""Calcula onde fica o pin de cada praia no mapa: no meio da faixa de areia.

    python scripts/centro_das_praias.py osm.json   (requer shapely)

`osm.json` é a resposta do Overpass para natural=beach em Niterói:

    [out:json];way["natural"="beach"](-22.995,-43.16,-22.88,-42.99);out geom tags;

Para cada praia do catálogo, usa o contorno de areia junto dos seus pontos de coleta
e, na metade do comprimento da praia, o lugar mais longe da água e da calçada.
Grava em praiometro/dados/centro_das_praias.json.
"""

import json
import math
import re
import sys
import unicodedata
from pathlib import Path

from shapely.geometry import Point, Polygon

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))
from praiometro.praias import agrupar  # noqa: E402

PASSO = 0.00004  # ~4 m
LIMITE_M = 50
FAIXA = 0.00015  # ~15 m para cada lado do meio


def simplificar(nome: str) -> str:
    sem_acento = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode().lower()
    return re.sub(r"^praia (d[aeo]s?|de) ", "", sem_acento).strip()


def contornos(osm: dict) -> list[tuple[str, Polygon]]:
    polis = []
    for e in osm["elements"]:
        geo = e.get("geometry") or []
        if e["type"] == "way" and len(geo) >= 4:
            nome = simplificar(e.get("tags", {}).get("name", ""))
            polis.append((nome, Polygon([(g["lon"], g["lat"]) for g in geo]).buffer(0)))
    return polis


def ponto_na_areia(areia: Polygon) -> Point:
    """No meio da praia (metade do comprimento), o lugar mais longe da água e da calçada."""
    # eixo comprido da praia: o lado maior do retângulo que a envolve
    cantos = list(areia.minimum_rotated_rectangle.exterior.coords)[:3]
    lados = [
        (cantos[1][0] - cantos[0][0], cantos[1][1] - cantos[0][1]),
        (cantos[2][0] - cantos[1][0], cantos[2][1] - cantos[1][1]),
    ]
    ux, uy = max(lados, key=lambda v: math.hypot(*v))
    norma = math.hypot(ux, uy)
    ux, uy = ux / norma, uy / norma
    centro = areia.minimum_rotated_rectangle.centroid

    x0, y0, x1, y1 = areia.bounds
    faixa = []  # pontos da areia na altura do meio do comprimento
    y = y0
    while y <= y1:
        x = x0
        while x <= x1:
            p = Point(x, y)
            if abs((x - centro.x) * ux + (y - centro.y) * uy) <= FAIXA and areia.contains(p):
                faixa.append((p, areia.exterior.distance(p)))
            x += PASSO
        y += PASSO
    if not faixa:
        return areia.representative_point()
    return max(faixa, key=lambda t: t[1])[0]


def main(caminho_osm: str) -> None:
    catalogo = json.loads((RAIZ / "praiometro/dados/praias.json").read_text(encoding="utf-8"))
    areias = contornos(json.loads(Path(caminho_osm).read_text(encoding="utf-8")))
    centros = {}
    for pid, praia in agrupar(catalogo).items():
        pts = [Point(*reversed(catalogo[c]["coordenadas_terra_decimais"])) for c in praia["pontos"]]
        # só contornos colados a um ponto de coleta (o pin fica onde a água é medida);
        # entre eles, o de mesmo nome ou, sem nome no OSM (Charitas), o maior
        perto = [(n, a) for n, a in areias if min(a.distance(p) for p in pts) * 111_000 <= LIMITE_M]
        perto = perto or [min(areias, key=lambda t: min(t[1].distance(p) for p in pts))]
        mesmo_nome = [a for n, a in perto if n == simplificar(praia["nome"])]
        areia = mesmo_nome[0] if mesmo_nome else max((a for _, a in perto), key=lambda a: a.area)
        alvo = ponto_na_areia(areia)
        centros[pid] = [round(alvo.y, 6), round(alvo.x, 6)]
        distancia = min(areia.distance(p) for p in pts) * 111_000
        print(f"{pid} {praia['nome']:<26} {centros[pid]}  contorno a {distancia:.0f} m dos pontos")
    destino = RAIZ / "praiometro/dados/centro_das_praias.json"
    destino.write_text(json.dumps(centros, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1])
