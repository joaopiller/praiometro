"""Gera a identidade visual do Praiômetro: as logos em SVG e PNG e a prancha.

    pip install fonttools uharfbuzz pillow
    python docs/identidade-visual/gerador/gerar.py

O nome é desenhado com a Poppins Bold (licença OFL, nesta pasta) e convertido em
contorno, então os arquivos não dependem de fonte instalada. Os PNG saem do Chrome,
com fundo transparente. Depois de mudar a logo, rode frontend/scripts/gerar-icones.py
para levar os arquivos novos para o app.
"""

import base64
import subprocess
import tempfile
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image

AQUI = Path(__file__).parent
FONTE = AQUI / "Poppins-Bold.ttf"
SAIDA = AQUI.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

AZUL = "#015486"
MAR = "#2FA8E8"
CEU = "#8FD8FF"
AREIA = "#F5D9A8"
AREIA_FORTE = "#E8B04E"
BRANCO = "#FFFFFF"

PALETAS = {
    # para usar sobre o azul da marca, fotos escuras e o próprio app
    "fundo-escuro": dict(
        t1=BRANCO, t2=CEU, arco=CEU, ponteiro=AREIA, onda1=CEU, onda2=MAR,
    ),
    # para papel, site claro e documentos
    "fundo-claro": dict(
        t1=AZUL, t2="#1C93D6", arco=AZUL, ponteiro=AREIA_FORTE, onda1="#1C93D6", onda2=CEU,
    ),
    "branca": dict.fromkeys(("t1", "t2", "arco", "ponteiro", "onda1", "onda2"), BRANCO),
    "azul": dict.fromkeys(("t1", "t2", "arco", "ponteiro", "onda1", "onda2"), AZUL),
}

_tt = TTFont(FONTE)
_glifos = _tt.getGlyphSet()
_ordem = _tt.getGlyphOrder()
_hb = hb.Font(hb.Face(FONTE.read_bytes()))
ALTURA_MAIUSCULA = _tt["OS/2"].sCapHeight / 1000


def _n(v: float) -> str:
    return f"{v:.2f}".rstrip("0").rstrip(".")


def texto(frase: str, tamanho: float, cores: list[tuple[int, str]]):
    """Contorno da frase com a linha de base em y=0. Devolve (svg, (x0, y0, x1, y1))."""
    buf = hb.Buffer()
    buf.add_str(frase)
    buf.guess_segment_properties()
    hb.shape(_hb, buf)
    assert len(buf.glyph_infos) == len(frase)
    k = tamanho / 1000
    cor_da_letra = [cor for n, cor in cores for _ in range(n)]
    limites = BoundsPen(_glifos)
    por_cor: dict[str, list[str]] = {}
    x = 0
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions, strict=True)):
        glifo = _glifos[_ordem[info.codepoint]]
        t = (k, 0, 0, -k, (x + pos.x_offset) * k, -pos.y_offset * k)
        caneta = SVGPathPen(_glifos, ntos=_n)
        glifo.draw(TransformPen(caneta, t))
        glifo.draw(TransformPen(limites, t))
        por_cor.setdefault(cor_da_letra[i], []).append(caneta.getCommands())
        x += pos.x_advance
    svg = "".join(f'<path fill="{cor}" d="{" ".join(ds)}"/>' for cor, ds in por_cor.items())
    return svg, limites.bounds


TRACO = 'fill="none" stroke-linecap="round"'


def marca(p: dict, reforcada: bool = False):
    """Medidor de onda: arco, ponteiro e duas ondas. Devolve (svg, largura, altura).

    A versão reforçada tem traços mais grossos, para tamanhos pequenos (ícone do app).
    """
    if reforcada:
        arco, ponteiro, eixo, onda, ponta, y1, y2, altura = 11, 8, 9, 7, "85.5 25", 77, 90, 104
    else:
        arco, ponteiro, eixo, onda, ponta, y1, y2, altura = 8, 6, 7, 5, "88 20", 74, 86, 98
    return (
        f'<path d="M18 56 A48 48 0 0 1 114 56" {TRACO} stroke="{p["arco"]}" stroke-width="{arco}"/>'
        f'<path d="M66 56 L{ponta}" {TRACO} stroke="{p["ponteiro"]}" stroke-width="{ponteiro}"/>'
        f'<circle cx="66" cy="56" r="{eixo}" fill="{p["ponteiro"]}"/>'
        f'<path d="M6 {y1} q15 -11 30 0 t30 0 t30 0 t30 0" {TRACO} stroke="{p["onda1"]}" stroke-width="{onda}"/>'
        f'<path d="M21 {y2} q15 -11 30 0 t30 0 t30 0" {TRACO} stroke="{p["onda2"]}" stroke-width="{onda}"/>',
        132,
        altura,
    )


# tamanho do nome, altura da marca e vão entre os dois em cada disposição, em unidades do desenho
MEDIDAS = dict(
    horizontal=dict(tam=40, alt=68, vao=16),
    vertical=dict(tam=30, alt=98, vao=12),
    compacta=dict(tam=34, alt=66, vao=14),
)

DISPOSICOES = ["horizontal", "vertical", "compacta", "icone", "icone-reforcado", "nome"]
# maior lado do PNG de cada disposição
LADO_PNG = {"horizontal": 2400, "vertical": 1600, "compacta": 2000, "icone": 1024, "icone-reforcado": 1024, "nome": 2400}


def montar(paleta: dict, disposicao: str):
    """Devolve (conteúdo svg, largura, altura) da logo na disposição pedida."""
    m_svg, mw, mh = marca(paleta, reforcada=disposicao == "icone-reforcado")
    cores = [(4, paleta["t1"]), (6, paleta["t2"])]
    # cada parte: (svg, transform, (x0, y0, x1, y1) já posicionada)
    partes = []

    def por_marca(x, y, s):
        partes.append((m_svg, f"translate({_n(x)} {_n(y)}) scale({_n(s)})", (x, y, x + mw * s, y + mh * s)))

    def por_texto(svg, lim, tx, ty):
        x0, y0, x1, y1 = lim
        partes.append((svg, f"translate({_n(tx)} {_n(ty)})", (tx + x0, ty + y0, tx + x1, ty + y1)))

    if disposicao.startswith("icone"):
        por_marca(0, 0, 1)
    elif disposicao == "nome":
        por_texto(*texto("Praiômetro", 48, cores), 0, 0)
    else:
        d = MEDIDAS[disposicao]
        tam, s, vao = d["tam"], d["alt"] / mh, d["vao"]
        if disposicao == "horizontal":
            svg, lim = texto("Praiômetro", tam, cores)
            por_marca(0, 0, s)
            # o meio da marca fica na altura do meio das maiúsculas
            por_texto(svg, lim, mw * s + vao - lim[0], mh * s / 2 + tam * ALTURA_MAIUSCULA / 2)
        elif disposicao == "vertical":
            svg, lim = texto("Praiômetro", tam, cores)
            meio = max(mw * s, lim[2] - lim[0]) / 2
            por_marca(meio - mw * s / 2, 0, s)
            por_texto(svg, lim, meio - (lim[0] + lim[2]) / 2, mh * s + vao - lim[1])
        else:
            l1, lim1 = texto("Prai", tam, [(4, paleta["t1"])])
            l2, lim2 = texto("ômetro", tam, [(6, paleta["t2"])])
            base1 = tam * ALTURA_MAIUSCULA
            base2 = base1 + tam
            por_marca(0, base2 / 2 - mh * s / 2, s)
            por_texto(l1, lim1, mw * s + vao - lim1[0], base1)
            por_texto(l2, lim2, mw * s + vao - lim2[0], base2)

    folga = 4 if disposicao.startswith("icone") else 6
    x0 = min(p[2][0] for p in partes) - folga
    y0 = min(p[2][1] for p in partes) - folga
    x1 = max(p[2][2] for p in partes) + folga
    y1 = max(p[2][3] for p in partes) + folga
    corpo = "".join(f'<g transform="{t}">{svg}</g>' for svg, t, _ in partes)
    return f'<g transform="translate({_n(-x0)} {_n(-y0)})">{corpo}</g>', x1 - x0, y1 - y0


def svg_final(corpo: str, w: float, h: float, lado: int, titulo: str) -> tuple[str, int, int]:
    k = lado / max(w, h)
    lw, lh = round(w * k), round(h * k)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {_n(w)} {_n(h)}" width="{lw}" height="{lh}" '
        f'role="img" aria-label="{titulo}"><title>{titulo}</title>{corpo}</svg>\n',
        lw,
        lh,
    )


def icone_do_app() -> str:
    """Quadrado de 1024 px, sem cantos arredondados: o sistema recorta."""
    m_svg, mw, mh = marca(PALETAS["fundo-escuro"], reforcada=True)
    s = 60 / mw
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1024" height="1024">'
        f'<rect width="100" height="100" fill="{AZUL}"/>'
        f'<g transform="translate({_n(50 - mw * s / 2)} {_n(50 - mh * s / 2)}) scale({_n(s)})">{m_svg}</g></svg>\n'
    )


def para_png(svg: Path, png: Path, w: int, h: int, perfil: str) -> None:
    subprocess.run(
        [
            CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
            "--default-background-color=00000000", f"--user-data-dir={perfil}", f"--window-size={w},{h}",
            f"--screenshot={png}", svg.as_uri(),
        ],
        check=True,
        capture_output=True,
    )
    with Image.open(png) as img:
        assert img.size == (w, h), (png.name, img.size, (w, h))


def gerar_logos(saida: Path, perfil: str) -> None:
    for sub in ("svg", "png", "icone-do-app"):
        (saida / sub).mkdir(parents=True, exist_ok=True)
    for nome_paleta, paleta in PALETAS.items():
        for disposicao in DISPOSICOES:
            corpo, w, h = montar(paleta, disposicao)
            arquivo = f"praiometro-{disposicao}-{nome_paleta}"
            svg, lw, lh = svg_final(corpo, w, h, LADO_PNG[disposicao], "Praiômetro")
            (saida / "svg" / f"{arquivo}.svg").write_text(svg, encoding="utf-8")
            para_png(saida / "svg" / f"{arquivo}.svg", saida / "png" / f"{arquivo}.png", lw, lh, perfil)
    icone = saida / "icone-do-app" / "icone-do-app.svg"
    icone.write_text(icone_do_app(), encoding="utf-8")
    para_png(icone, icone.with_suffix(".png"), 1024, 1024, perfil)
    print("logos geradas em", saida)


if __name__ == "__main__":
    from pranchas import gerar_prancha

    with tempfile.TemporaryDirectory() as perfil:
        gerar_logos(SAIDA, perfil)
        gerar_prancha(SAIDA, perfil, base64.b64encode(FONTE.read_bytes()).decode())
