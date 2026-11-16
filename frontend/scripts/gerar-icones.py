"""Leva a logo da identidade visual para o app.

    python scripts/gerar-icones.py   (requer Pillow)

Parte dos PNG de docs/identidade-visual (gerados por docs/identidade-visual/gerador):

- logo-header.png: logo horizontal dos cabeçalhos
- logo-abertura.png: logo vertical da tela de abertura
- icone.png: ícone completo 1024x1024 (iOS e Android antigo)
- icone-adaptativo.png: só a marca, sobre fundo transparente, dentro da área segura
  do ícone adaptativo do Android (o sistema aplica a máscara e a cor de fundo
  definida no app.config.ts)
- icone-monocromatico.png: a marca em uma cor, para os ícones temáticos do Android 13+
"""

from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
IDENTIDADE = RAIZ.parent / "docs/identidade-visual"
DESTINO = RAIZ / "assets/images"
LADO = 1024


def logo(nome: str, largura: int) -> Image.Image:
    img = Image.open(IDENTIDADE / "png" / f"praiometro-{nome}.png").convert("RGBA")
    return img.resize((largura, round(img.height * largura / img.width)), Image.LANCZOS)


def marca_centralizada(nome: str, largura: int) -> Image.Image:
    marca = logo(nome, largura)
    tela = Image.new("RGBA", (LADO, LADO), (0, 0, 0, 0))
    tela.alpha_composite(marca, ((LADO - marca.width) // 2, (LADO - marca.height) // 2))
    return tela


if __name__ == "__main__":
    # 4x o tamanho em que aparecem na tela (168 pt no cabeçalho, 170 pt na abertura)
    logo("horizontal-fundo-escuro", 840).save(DESTINO / "logo-header.png", optimize=True)
    logo("vertical-fundo-escuro", 680).save(DESTINO / "logo-abertura.png", optimize=True)
    Image.open(IDENTIDADE / "icone-do-app/icone-do-app.png").convert("RGB").save(DESTINO / "icone.png", optimize=True)
    # a área segura do ícone adaptativo é um círculo de ~61% do lado; 46% de largura cabe nele com folga
    marca_centralizada("icone-reforcado-fundo-escuro", round(LADO * 0.46)).save(
        DESTINO / "icone-adaptativo.png", optimize=True
    )
    marca_centralizada("icone-reforcado-branca", round(LADO * 0.46)).save(
        DESTINO / "icone-monocromatico.png", optimize=True
    )
    print("logo e ícones gerados em", DESTINO)
