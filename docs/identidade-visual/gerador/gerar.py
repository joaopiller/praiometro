"""Gera a identidade visual do Praiômetro: as logos em SVG e PNG e a prancha.

    pip install fonttools uharfbuzz pillow
    python docs/identidade-visual/gerador/gerar.py

O nome é desenhado com a Poppins Bold (licença OFL, nesta pasta) e convertido em
contorno, então os arquivos não dependem de fonte instalada. Os PNG saem do Chrome,
com fundo transparente. Depois de mudar a logo, rode frontend/scripts/gerar-icones.py
para levar os arquivos novos para o app.
"""

import base64
import math
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
AZUL_FUNDO = "#013B60"
MAR = "#2FA8E8"
CEU = "#8FD8FF"
AREIA = "#F5D9A8"
AREIA_FORTE = "#E8B04E"
BRANCO = "#FFFFFF"

PALETAS = {
    # para usar sobre o azul da marca, fotos escuras e o próprio app
    "fundo-escuro": {"t1": BRANCO, "t2": CEU, "anel": CEU, "disco": AZUL_FUNDO, "sol": AREIA, "onda1": CEU, "onda2": MAR},
    # para papel, site claro e documentos
    "fundo-claro": {"t1": AZUL, "t2": "#1C93D6", "anel": AZUL, "disco": AZUL, "sol": AREIA, "onda1": CEU, "onda2": MAR},
    "branca": {"t1": BRANCO, "t2": BRANCO, "mono": BRANCO},
    "azul": {"t1": AZUL, "t2": AZUL, "mono": AZUL},
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


ONDA_1 = "M0 44 q10 -9 20 0 t20 0 t20 0 t20 0"
ONDA_2 = "M-10 57 q10 -9 20 0 t20 0 t20 0 t20 0 t20 0"


def marca(p: dict):
    """Sol e mar: o sol descendo sobre duas ondas, dentro de um anel. Devolve (svg, largura, altura)."""
    if "mono" in p:
        cor = p["mono"]
        # numa cor só, as ondas se separam por um vão em vez de mudar de tom
        return (
            '<defs><clipPath id="dentro"><circle cx="40" cy="40" r="33"/></clipPath>'
            '<mask id="vaos" maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="80">'
            '<rect width="80" height="80" fill="#fff"/>'
            f'<path d="{ONDA_1}" fill="none" stroke="#000" stroke-width="4"/>'
            f'<path d="{ONDA_2}" fill="none" stroke="#000" stroke-width="3.5"/></mask></defs>'
            '<g clip-path="url(#dentro)"><g mask="url(#vaos)">'
            f'<circle cx="40" cy="32" r="15" fill="{cor}"/>'
            f'<path d="{ONDA_1} V80 H0 Z" fill="{cor}"/></g></g>'
            f'<circle cx="40" cy="40" r="34" fill="none" stroke="{cor}" stroke-width="4"/>',
            80,
            80,
        )
    return (
        '<defs><clipPath id="dentro"><circle cx="40" cy="40" r="34"/></clipPath></defs>'
        f'<circle cx="40" cy="40" r="34" fill="{p["disco"]}"/>'
        '<g clip-path="url(#dentro)">'
        f'<circle cx="40" cy="32" r="15" fill="{p["sol"]}"/>'
        f'<path d="{ONDA_1} V80 H0 Z" fill="{p["onda1"]}"/>'
        f'<path d="{ONDA_2} V80 H-10 Z" fill="{p["onda2"]}"/></g>'
        f'<circle cx="40" cy="40" r="34" fill="none" stroke="{p["anel"]}" stroke-width="4"/>',
        80,
        80,
    )


# tamanho do nome, altura da marca e vão entre os dois em cada disposição, em unidades do desenho
MEDIDAS = {
    "horizontal": {"tam": 40, "alt": 74, "vao": 18},
    "vertical": {"tam": 30, "alt": 92, "vao": 14},
    "compacta": {"tam": 34, "alt": 66, "vao": 16},
}

DISPOSICOES = ["horizontal", "vertical", "compacta", "icone", "nome"]
# maior lado do PNG de cada disposição
LADO_PNG = {"horizontal": 2400, "vertical": 1600, "compacta": 2000, "icone": 1024, "nome": 2400}


def montar(paleta: dict, disposicao: str):
    """Devolve (conteúdo svg, largura, altura) da logo na disposição pedida."""
    m_svg, mw, mh = marca(paleta)
    cores = [(4, paleta["t1"]), (6, paleta["t2"])]
    # cada parte: (svg, transform, (x0, y0, x1, y1) já posicionada)
    partes = []

    def por_marca(x, y, s):
        partes.append((m_svg, f"translate({_n(x)} {_n(y)}) scale({_n(s)})", (x, y, x + mw * s, y + mh * s)))

    def por_texto(svg, lim, tx, ty):
        x0, y0, x1, y1 = lim
        partes.append((svg, f"translate({_n(tx)} {_n(ty)})", (tx + x0, ty + y0, tx + x1, ty + y1)))

    if disposicao == "icone":
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

    folga = 4 if disposicao == "icone" else 6
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


def _onda(x0: float, y: float, lado: float, cor: str) -> str:
    """Onda cheia de lado a lado, da altura `y` até a base."""
    while x0 > 0:
        x0 -= 55
    curvas = math.ceil((lado - x0) / 27.5)
    return f'<path d="M{_n(x0)} {_n(y)} q13.75 -12 27.5 0{" t27.5 0" * curvas} V{_n(lado)} H{_n(x0)} Z" fill="{cor}"/>'


def icone_do_app(lado: float = 100) -> str:
    """A cena da marca ocupando o ícone inteiro: quadrado de 1024 px, sem cantos (o sistema recorta).

    Com `lado` maior que 100 a cena fica no meio e o mar segue até as bordas: é o ícone
    adaptativo do Android, que só mostra os dois terços centrais.
    """
    d = (lado - 100) / 2
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {_n(lado)} {_n(lado)}" width="1024" height="1024">'
        f'<rect width="{_n(lado)}" height="{_n(lado)}" fill="{AZUL}"/>'
        f'<circle cx="{_n(lado / 2)}" cy="{_n(d + 40)}" r="20" fill="{AREIA}"/>'
        f"{_onda(d - 5, d + 58, lado, CEU)}{_onda(d - 18.75, d + 76, lado, MAR)}</svg>\n"
    )


def icone_monocromatico() -> str:
    """Sol e duas ondas em uma cor, para os ícones temáticos do Android 13+."""
    traco = 'fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"'
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="1024" height="1024">'
        '<circle cx="75" cy="60" r="18" fill="#fff"/>'
        f'<path d="M41 88 q8.5 -8 17 0 t17 0 t17 0 t17 0" {traco}/>'
        f'<path d="M49.5 101 q8.5 -8 17 0 t17 0 t17 0" {traco}/></svg>\n'
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
    icones = {
        "icone-do-app": icone_do_app(),
        "icone-do-app-adaptativo": icone_do_app(150),
        "icone-do-app-monocromatico": icone_monocromatico(),
    }
    for nome, svg in icones.items():
        arquivo = saida / "icone-do-app" / f"{nome}.svg"
        arquivo.write_text(svg, encoding="utf-8")
        para_png(arquivo, arquivo.with_suffix(".png"), 1024, 1024, perfil)
    print("logos geradas em", saida)


if __name__ == "__main__":
    from pranchas import gerar_prancha

    with tempfile.TemporaryDirectory() as perfil:
        gerar_logos(SAIDA, perfil)
        gerar_prancha(SAIDA, perfil, base64.b64encode(FONTE.read_bytes()).decode())
