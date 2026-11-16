"""Gera os pins do mapa (assets/images/pins/*.png).

    python scripts/gerar-pins.py   (requer Pillow)

Um pin por situação da praia (própria, imprópria, só em parte, sem dados), mais a versão "selecionado" (com anel
cor de areia). O ícone é o banhista: a cor responde se dá para nadar.
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
FONTE = RAIZ / "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome6_Solid.ttf"
BANHISTA = chr(62916)  # fa-person-swimming

CORES = {
    "propria": (47, 163, 90),
    "impropria": (217, 72, 59),
    # praia boa só em alguns trechos
    "parcial": (226, 160, 38),
    "sem-dados": (93, 118, 144),
}
AREIA = (245, 217, 168)
ESCALA = 4  # desenha grande e reduz, para bordas suaves


def clarear(cor, f):
    return tuple(round(c + (255 - c) * f) for c in cor)


def escurecer(cor, f):
    return tuple(round(c * (1 - f)) for c in cor)


def gota(tamanho, cx, cy, raio, ponta_y) -> Image.Image:
    """Máscara da gota: círculo + lados tangentes até a ponta (sem quina)."""
    mascara = Image.new("L", tamanho, 0)
    d = ImageDraw.Draw(mascara)
    d.ellipse((cx - raio, cy - raio, cx + raio, cy + raio), fill=255)
    dist = ponta_y - cy
    ty = cy + raio**2 / dist
    tx = raio * math.sqrt(1 - (raio / dist) ** 2)
    d.polygon([(cx - tx, ty), (cx + tx, ty), (cx, ponta_y)], fill=255)
    return mascara


def degrade(tamanho, cima, baixo) -> Image.Image:
    img = Image.new("RGBA", tamanho)
    d = ImageDraw.Draw(img)
    for y in range(tamanho[1]):
        t = y / max(1, tamanho[1] - 1)
        d.line([(0, y), (tamanho[0], y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(cima, baixo, strict=True)))
    return img


def pin(cor, selecionado: bool) -> Image.Image:
    largura, altura = (112, 140) if selecionado else (96, 120)
    w, h = largura * ESCALA, altura * ESCALA
    raio = w * (0.36 if selecionado else 0.42)
    cx, cy = w / 2, h * (0.40 if selecionado else 0.39)
    ponta_y = h * 0.93
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    sombra = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(sombra).ellipse((cx - w * 0.16, ponta_y - h * 0.035, cx + w * 0.16, ponta_y + h * 0.035), fill=(0, 30, 50, 110))
    img.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(ESCALA * 2.5)))

    if selecionado:
        halo = gota((w, h), cx, cy, raio * 1.22, ponta_y + ESCALA * 2)
        img.paste(Image.new("RGBA", (w, h), AREIA + (255,)), (0, 0), halo)

    img.paste(Image.new("RGBA", (w, h), (255, 255, 255, 255)), (0, 0), gota((w, h), cx, cy, raio, ponta_y))
    borda = raio * 0.13
    interno = gota((w, h), cx, cy, raio - borda, ponta_y - borda * 1.9)
    img.paste(degrade((w, h), clarear(cor, 0.22), escurecer(cor, 0.12)), (0, 0), interno)

    fonte = ImageFont.truetype(str(FONTE), int(raio * 0.95))
    d = ImageDraw.Draw(img)
    caixa = d.textbbox((0, 0), BANHISTA, font=fonte)
    x = cx - (caixa[2] - caixa[0]) / 2 - caixa[0]
    y = cy - (caixa[3] - caixa[1]) / 2 - caixa[1]
    d.text((x, y + ESCALA * 1.5), BANHISTA, font=fonte, fill=escurecer(cor, 0.35) + (110,))
    d.text((x, y), BANHISTA, font=fonte, fill=(255, 255, 255, 255))
    return img.resize((largura, altura), Image.LANCZOS)


if __name__ == "__main__":
    destino = RAIZ / "assets/images/pins"
    destino.mkdir(parents=True, exist_ok=True)
    for nome, cor in CORES.items():
        pin(cor, False).save(destino / f"pin-{nome}.png", optimize=True)
        pin(cor, True).save(destino / f"pin-{nome}-sel.png", optimize=True)
    print("pins gerados em", destino)
