"""Leva a logo da identidade visual para o app.

    python scripts/gerar-icones.py   (requer Pillow)

Parte dos PNG de docs/identidade-visual (gerados por docs/identidade-visual/gerador):

- logo-header.png: logo horizontal dos cabeçalhos
- logo-abertura.png: logo vertical da tela de abertura
- icone.png: ícone completo 1024x1024 (iOS e Android antigo)
- icone-adaptativo.png: a mesma cena com folga em volta, para o ícone adaptativo do
  Android (o sistema recorta as bordas)
- icone-monocromatico.png: a marca em uma cor, para os ícones temáticos do Android 13+
"""

from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
IDENTIDADE = RAIZ.parent / "docs/identidade-visual"
DESTINO = RAIZ / "assets/images"


def logo(nome: str, largura: int) -> Image.Image:
    img = Image.open(IDENTIDADE / "png" / f"praiometro-{nome}.png").convert("RGBA")
    return img.resize((largura, round(img.height * largura / img.width)), Image.LANCZOS)


if __name__ == "__main__":
    # 4x o tamanho em que aparecem na tela (168 pt no cabeçalho, 170 pt na abertura)
    logo("horizontal-fundo-escuro", 840).save(DESTINO / "logo-header.png", optimize=True)
    logo("vertical-fundo-escuro", 680).save(DESTINO / "logo-abertura.png", optimize=True)
    icones = IDENTIDADE / "icone-do-app"
    Image.open(icones / "icone-do-app.png").convert("RGB").save(DESTINO / "icone.png", optimize=True)
    # no adaptativo a cena fica nos dois terços centrais e o mar vai até as bordas, que o sistema recorta
    Image.open(icones / "icone-do-app-adaptativo.png").convert("RGB").save(
        DESTINO / "icone-adaptativo.png", optimize=True
    )
    Image.open(icones / "icone-do-app-monocromatico.png").save(DESTINO / "icone-monocromatico.png", optimize=True)
    print("logo e ícones gerados em", DESTINO)
