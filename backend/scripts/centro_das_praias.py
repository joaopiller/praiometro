"""Calcula onde fica o pin de cada praia no mapa: no meio da faixa de areia.

    python scripts/centro_das_praias.py osm_niteroi.json osm_rio.json ...   (requer shapely)

Cada arquivo é uma resposta do Overpass com os contornos de areia (natural=beach) e,
para praias mapeadas como multipolígono, os caminhos que formam cada uma:

    [out:json];(way["natural"="beach"](S,O,N,L);rel["natural"="beach"](S,O,N,L););
    out body;way(r);out geom;

Para cada praia do catálogo, usa o contorno de areia junto dos seus pontos de coleta
e, na metade do comprimento da praia, o lugar mais longe da água e da calçada. Quando
duas praias dividem o mesmo contorno (no OpenStreetMap São Conrado e Pepino são uma
areia só), o meio é o dos trechos da própria praia.
Grava em praiometro/dados/centro_das_praias.json.
"""

import json
import math
import re
import sys
import unicodedata
from pathlib import Path

from shapely.geometry import LineString, Point, Polygon
from shapely.ops import linemerge, polygonize, unary_union

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))
from praiometro.praias import agrupar  # noqa: E402

PASSO = 0.00004  # ~4 m
LIMITE_M = 50
FAIXA = 0.00015  # ~15 m para cada lado do meio


def simplificar(nome: str) -> str:
    sem_acento = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode().lower()
    return re.sub(r"^praia (d[aeo]s? |de )?", "", sem_acento).strip()


def contornos(arquivos: list[dict]) -> list[tuple[str, Polygon]]:
    elementos = [e for osm in arquivos for e in osm["elements"]]
    caminhos = {e["id"]: e["geometry"] for e in elementos if e["type"] == "way" and e.get("geometry")}
    polis = []
    for e in elementos:
        nome = simplificar(e.get("tags", {}).get("name", ""))
        if (
            e["type"] == "way"
            and e.get("tags", {}).get("natural") == "beach"
            and len(e.get("geometry") or []) >= 4
        ):
            polis.append((nome, Polygon([(g["lon"], g["lat"]) for g in e["geometry"]]).buffer(0)))
        elif e["type"] == "relation" and e.get("members"):
            linhas = [
                LineString([(g["lon"], g["lat"]) for g in caminhos[m["ref"]]])
                for m in e["members"]
                if m.get("role") == "outer" and m["ref"] in caminhos
            ]
            if linhas:
                polis.append((nome, unary_union(list(polygonize(linemerge(linhas)))).buffer(0)))
    return polis


def eixo(areia: Polygon) -> tuple[Point, float, float]:
    """Centro e direção do comprimento da praia (o lado maior do retângulo que a envolve)."""
    cantos = list(areia.minimum_rotated_rectangle.exterior.coords)[:3]
    lados = [
        (cantos[1][0] - cantos[0][0], cantos[1][1] - cantos[0][1]),
        (cantos[2][0] - cantos[1][0], cantos[2][1] - cantos[1][1]),
    ]
    ux, uy = max(lados, key=lambda v: math.hypot(*v))
    norma = math.hypot(ux, uy)
    return areia.minimum_rotated_rectangle.centroid, ux / norma, uy / norma


def ponto_na_areia(areia: Polygon, trechos: list[Point] | None = None) -> Point:
    """Na altura do meio da praia (ou do meio dos `trechos`), o lugar mais longe da água e da calçada."""
    centro, ux, uy = eixo(areia)
    altura = 0.0
    if trechos:
        altura = sum((p.x - centro.x) * ux + (p.y - centro.y) * uy for p in trechos) / len(trechos)

    x0, y0, x1, y1 = areia.bounds
    faixa = []
    y = y0
    while y <= y1:
        x = x0
        while x <= x1:
            p = Point(x, y)
            if abs((x - centro.x) * ux + (y - centro.y) * uy - altura) <= FAIXA and areia.contains(p):
                faixa.append((p, areia.exterior.distance(p)))
            x += PASSO
        y += PASSO
    if not faixa:
        return areia.representative_point()
    return max(faixa, key=lambda t: t[1])[0]


def main(caminhos_osm: list[str]) -> None:
    catalogo = json.loads((RAIZ / "praiometro/dados/praias.json").read_text(encoding="utf-8"))
    areias = contornos([json.loads(Path(c).read_text(encoding="utf-8")) for c in caminhos_osm])
    escolhidas = {}
    for pid, praia in agrupar(catalogo).items():
        pts = [Point(*reversed(catalogo[c]["coordenadas_terra_decimais"])) for c in praia["pontos"]]
        # só contornos colados a um ponto de coleta (o pin fica onde a água é medida);
        # entre eles, o de mesmo nome ou, sem nome no OSM (Charitas), o maior
        perto = [(n, a) for n, a in areias if min(a.distance(p) for p in pts) * 111_000 <= LIMITE_M]
        perto = perto or [min(areias, key=lambda t: min(t[1].distance(p) for p in pts))]
        nome = simplificar(praia["nome"])
        mesmo_nome = [a for n, a in perto if n == nome or n.startswith(nome + " ")]
        escolhidas[pid] = (
            mesmo_nome[0] if mesmo_nome else max((a for _, a in perto), key=lambda a: a.area),
            pts,
        )

    centros = {}
    for pid, (areia, pts) in escolhidas.items():
        dividida = sum(1 for a, _ in escolhidas.values() if a is areia) > 1
        alvo = ponto_na_areia(areia, pts if dividida else None)
        centros[pid] = [round(alvo.y, 6), round(alvo.x, 6)]
        print(f"{pid:20} {centros[pid]}{'  (areia dividida)' if dividida else ''}")
    destino = RAIZ / "praiometro/dados/centro_das_praias.json"
    destino.write_text(json.dumps(centros, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])
