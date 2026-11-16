"""Gera os ícones do app a partir de assets/images/logo-header.png.

    python scripts/gerar-icones.py   (requer Pillow)

- icone.png: ícone completo 1024x1024 (iOS e Android antigo)
- icone-adaptativo.png: só a logo, sobre fundo transparente, dentro da área
  segura do ícone adaptativo do Android (o sistema aplica a máscara e a cor
  de fundo definida no app.config.ts)
"""

from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
AZUL = (1, 84, 134, 255)  # #015486
LADO = 1024


def logo_centralizada(largura: int, fundo) -> Image.Image:
    logo = Image.open(RAIZ / "assets/images/logo-header.png").convert("RGBA")
    logo = logo.resize((largura, round(logo.height * largura / logo.width)), Image.LANCZOS)
    tela = Image.new("RGBA", (LADO, LADO), fundo)
    tela.alpha_composite(logo, ((LADO - logo.width) // 2, (LADO - logo.height) // 2))
    return tela


if __name__ == "__main__":
    destino = RAIZ / "assets/images"
    # a área segura do ícone adaptativo é um círculo de ~61% do lado; 55% de largura cabe nele
    logo_centralizada(round(LADO * 0.55), (0, 0, 0, 0)).save(destino / "icone-adaptativo.png", optimize=True)
    logo_centralizada(round(LADO * 0.72), AZUL).convert("RGB").save(destino / "icone.png", optimize=True)
    print("ícones gerados em", destino)
