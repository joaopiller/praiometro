"""Prancha da identidade: as versões da logo, as cores, a tipografia e exemplos no app."""

import subprocess
from pathlib import Path

from PIL import Image

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
LARGURA = 1600
FIM = (255, 0, 255)

CSS = """
@font-face { font-family: Poppins; font-weight: 700; src: url(data:font/ttf;base64,%(fonte)s); }
* { box-sizing: border-box; margin: 0; }
html { background: #F6F3EC; }
body { width: 1600px; padding: 56px 64px 0; font-family: -apple-system, 'Helvetica Neue', sans-serif; color: #12324A; }
h1 { font: 700 44px Poppins; color: #015486; }
h2 { font: 700 24px Poppins; color: #015486; margin: 52px 0 18px; }
.sub { font-size: 20px; color: #4A6478; margin-top: 6px; }
.capa { margin-top: 28px; height: 400px; border-radius: 28px; background: #015486; position: relative; overflow: hidden;
        display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 26px; }
.capa img.logo { height: %(capa_altura)spx; position: relative; }
.capa .frase { font: 700 22px Poppins; color: #F5D9A8; position: relative; letter-spacing: .3px; }
.capa svg.fundo { position: absolute; inset: 0; width: 100%%; height: 100%%; }
.grade { display: grid; grid-template-columns: 150px repeat(5, 1fr); gap: 12px; align-items: stretch; }
.grade .rotulo { font-size: 15px; color: #4A6478; display: flex; align-items: center; line-height: 1.3; }
.grade .topo { font-size: 14px; color: #4A6478; text-align: center; padding-bottom: 2px; }
.q { height: 132px; border-radius: 16px; display: flex; align-items: center; justify-content: center; padding: 18px; }
.q img { max-width: 100%%; max-height: 100%%; }
.claro { background: #fff; box-shadow: inset 0 0 0 1px #DDD6C8; }
.cores { display: grid; grid-template-columns: repeat(%(n_cores)s, 1fr); gap: 12px; }
.cor { border-radius: 16px; overflow: hidden; background: #fff; box-shadow: inset 0 0 0 1px #DDD6C8; }
.cor i { display: block; height: 96px; }
.cor b { display: block; font: 700 15px Poppins; padding: 12px 14px 0; color: #12324A; }
.cor span { display: block; font-size: 13px; padding: 2px 14px 12px; color: #4A6478; }
.tipos { display: grid; grid-template-columns: 1.3fr 1fr; gap: 12px; }
.tipo { background: #fff; border-radius: 16px; padding: 26px 30px; box-shadow: inset 0 0 0 1px #DDD6C8; }
.tipo small { font-size: 13px; color: #4A6478; display: block; margin-bottom: 8px; }
.tipo .p { font: 700 40px/1.15 Poppins; color: #015486; }
.tipo .s { font-size: 21px; line-height: 1.45; color: #12324A; }
.usos { display: grid; grid-template-columns: 1.15fr 1fr 1.5fr .9fr; gap: 12px; align-items: stretch; }
.uso { background: #fff; border-radius: 16px; padding: 22px; box-shadow: inset 0 0 0 1px #DDD6C8; display: flex; flex-direction: column; gap: 16px; }
.uso small { font-size: 14px; color: #4A6478; }
.uso .meio { flex: 1; display: flex; align-items: center; justify-content: center; gap: 18px; flex-wrap: wrap; }
.app { border-radius: 22.5%%; overflow: hidden; box-shadow: 0 6px 16px rgba(1,59,96,.25); }
.app img { display: block; width: 100%%; height: 100%%; }
.avatar { width: 150px; height: 150px; border-radius: 50%%; background: #015486; display: flex; align-items: center; justify-content: center; }
.avatar img { width: 62%%; }
.barra { width: 100%%; border-radius: 20px; background: #0B5A90; padding: 16px 16px 16px 22px; display: flex; align-items: center; justify-content: space-between; }
.barra img { height: 46px; }
.barra div { background: rgba(255,255,255,.14); border-radius: 12px; padding: 8px 16px; color: #fff; font-weight: 800; font-size: 22px; line-height: 1.1; }
.barra div span { display: block; font-weight: 400; font-size: 13px; color: rgba(255,255,255,.8); }
.fone { width: 170px; height: 330px; border-radius: 30px; background: linear-gradient(#0A639E, #015486 45%%, #013B60); position: relative; overflow: hidden;
        display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(1,59,96,.25); }
.fone img { width: 68%%; margin-bottom: 40px; }
.fone svg { position: absolute; left: 0; bottom: 0; width: 100%%; }
.nota { font-size: 15px; color: #4A6478; margin-top: 14px; line-height: 1.5; }
#fim { height: 4px; margin: 56px -64px 0; background: #FF00FF; }
"""

CORES_BASE = [
    ("#015486", "Azul Praiômetro", "cor principal, fundos"),
    ("#013B60", "Azul profundo", "fundo escuro, textos"),
    ("#2FA8E8", "Azul mar", "ondas, destaques"),
    ("#8FD8FF", "Azul céu", "parte clara do nome"),
    ("#F5D9A8", "Areia", "sol da marca, botões"),
]

FUNDO = """<svg class="fundo" viewBox="0 0 1472 400" preserveAspectRatio="xMidYMid slice">
<circle cx="1250" cy="250" r="130" fill="#0B6199"/>
<path d="M0 300 q92 -52 184 0 t184 0 t184 0 t184 0 t184 0 t184 0 t184 0 t184 0 V400 H0 Z" fill="#0D69A4"/>
<path d="M-92 345 q92 -46 184 0 t184 0 t184 0 t184 0 t184 0 t184 0 t184 0 t184 0 t184 0 V400 H-92 Z" fill="#1178B8"/></svg>"""

AREIA_DO_FONE = '<svg viewBox="0 0 170 46"><path d="M0 16 q21 -12 42.5 0 t42.5 0 t42.5 0 t42.5 0 V46 H0 Z" fill="#F5D9A8"/></svg>'


TITULO = "Identidade visual do Praiômetro"
CONCEITO = "O sol descendo sobre o mar, dentro de um selo: a marca de quem convida para a praia já sabendo como ela está."
FRASE = "Sol, mar e informação."
CORES = [
    *CORES_BASE,
    ("#FFC83D", "Sol", "ícones de clima, avisos"),
    ("#E8B04E", "Areia forte", "areia sobre fundo claro"),
    ("#E6F6FF", "Espuma", "fundos claros"),
]

LINHAS = [
    ("fundo-escuro", "Colorida, para fundo escuro", "background:#015486"),
    ("fundo-claro", "Colorida, para fundo claro", None),
    ("branca", "Uma cor, branca", "background:#2FA8E8"),
    ("azul", "Uma cor, azul", "background:#F5D9A8"),
]
COLUNAS = [
    ("horizontal", "Horizontal"),
    ("vertical", "Vertical"),
    ("compacta", "Compacta"),
    ("icone", "Só o ícone"),
    ("nome", "Só o nome"),
]


def html_da_prancha(fonte_b64: str) -> str:
    def svg(disposicao: str, paleta: str) -> str:
        return f"svg/praiometro-{disposicao}-{paleta}.svg"

    grade = '<div class="rotulo"></div>' + "".join(f'<div class="topo">{nome}</div>' for _, nome in COLUNAS)
    for paleta, rotulo, fundo in LINHAS:
        grade += f'<div class="rotulo">{rotulo}</div>'
        for disposicao, _ in COLUNAS:
            estilo = f' style="{fundo}"' if fundo else ""
            classe = "q" if fundo else "q claro"
            grade += f'<div class="{classe}"{estilo}><img src="{svg(disposicao, paleta)}"></div>'

    cores = "".join(
        f'<div class="cor"><i style="background:{hexa}"></i><b>{nome}</b><span>{hexa} · {uso}</span></div>'
        for hexa, nome, uso in CORES
    )
    icones = "".join(
        f'<div class="app" style="width:{lado}px;height:{lado}px"><img src="icone-do-app/icone-do-app.png"></div>'
        for lado in (118, 76, 48)
    )
    css = CSS % {"fonte": fonte_b64, "capa_altura": 150, "n_cores": len(CORES)}
    return f"""<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>{TITULO}</title><style>{css}</style><body>
<h1>{TITULO}</h1>
<p class="sub">{CONCEITO}</p>
<div class="capa">{FUNDO}<img class="logo" src="{svg("horizontal", "fundo-escuro")}"><div class="frase">{FRASE}</div></div>

<h2>Versões da logo</h2>
<div class="grade">{grade}</div>
<p class="nota">Todos os arquivos têm fundo transparente, em SVG (vetor) e PNG. Os fundos coloridos aqui são só para mostrar onde cada versão funciona.</p>

<h2>Cores</h2>
<div class="cores">{cores}</div>
<p class="nota">O amarelo do sol e os tons de areia aquecem a paleta. Verde, amarelo e vermelho ficam só para a situação de banho.</p>

<h2>Tipografia</h2>
<div class="tipos">
<div class="tipo"><small>Nome e títulos · Poppins Bold</small><div class="p">Como está a praia agora?</div></div>
<div class="tipo"><small>Textos · fonte do sistema (SF Pro no iPhone, Roboto no Android)</small><div class="s">Própria para banho. Boletim do INEA de 12/11, ondas de 1,2 m e vento fraco.</div></div>
</div>

<h2>No app</h2>
<div class="usos">
<div class="uso"><small>Ícone do app</small><div class="meio" style="align-items:flex-end">{icones}</div></div>
<div class="uso"><small>Foto de perfil nas redes</small><div class="meio"><div class="avatar"><img src="{svg("icone", "fundo-escuro")}"></div></div></div>
<div class="uso"><small>Cabeçalho do mapa</small><div class="meio"><div class="barra"><img src="{svg("horizontal", "fundo-escuro")}"><div>24°<span>Garoa</span></div></div></div></div>
<div class="uso"><small>Tela de abertura</small><div class="meio"><div class="fone"><img src="{svg("vertical", "fundo-escuro")}">{AREIA_DO_FONE}</div></div></div>
</div>
<div id="fim"></div>
</body></html>"""


def gerar_prancha(saida: Path, perfil: str, fonte_b64: str) -> None:
    pagina = saida / "prancha.html"
    pagina.write_text(html_da_prancha(fonte_b64), encoding="utf-8")
    png = saida / "prancha.png"
    subprocess.run(
        [
            CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
            "--allow-file-access-from-files", f"--user-data-dir={perfil}", f"--window-size={LARGURA},3600",
            "--virtual-time-budget=3000", f"--screenshot={png}", pagina.as_uri(),
        ],
        check=True,
        capture_output=True,
    )
    # a página termina numa faixa de cor única: corta ali
    with Image.open(png) as img:
        img = img.convert("RGB")
        fim = next(y for y in range(img.height) if img.getpixel((10, y)) == FIM)
        img.crop((0, 0, LARGURA, fim)).save(png)
    print("prancha gerada em", png)
