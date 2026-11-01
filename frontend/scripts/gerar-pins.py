"""Gera os pins do mapa (assets/images/pins/*.png).

    python scripts/gerar-pins.py   (requer Pillow)
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
FONTE = RAIZ / "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome6_Solid.ttf"
GUARDA_SOL = chr(62922)  # fa-umbrella-beach

CORES = {"propria": "#2FA35A", "impropria": "#D9483B", "sem-dados": "#5D7690"}
ESCALA = 4  # desenha grande e reduz, para bordas suaves
W, H = 96, 120  # @3x de um pin 32x40


def pin(cor: str) -> Image.Image:
    w, h = W * ESCALA, H * ESCALA
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    sombra = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ds = ImageDraw.Draw(sombra)
    ds.ellipse((w * 0.3, h * 0.9, w * 0.7, h * 0.98), fill=(0, 0, 0, 90))
    img.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(ESCALA * 3)))

    d = ImageDraw.Draw(img)
    r = w * 0.42
    cx, cy = w / 2, r + w * 0.06
    ponta = (cx, h * 0.93)
    borda = w * 0.06

    def gota(raio, cor_):
        d.ellipse((cx - raio, cy - raio, cx + raio, cy + raio), fill=cor_)
        d.polygon([(cx - raio * 0.72, cy + raio * 0.69), (cx + raio * 0.72, cy + raio * 0.69), ponta], fill=cor_)

    gota(r, "white")
    gota(r - borda, cor)
    # a ponta interna precisa de cor para não ficar branca
    d.polygon(
        [(cx - (r - borda) * 0.6, cy + (r - borda) * 0.75), (cx + (r - borda) * 0.6, cy + (r - borda) * 0.75),
         (ponta[0], ponta[1] - borda * 1.6)],
        fill=cor,
    )

    fonte = ImageFont.truetype(str(FONTE), int(r * 1.05))
    caixa = d.textbbox((0, 0), GUARDA_SOL, font=fonte)
    tw, th = caixa[2] - caixa[0], caixa[3] - caixa[1]
    d.text((cx - tw / 2 - caixa[0], cy - th / 2 - caixa[1]), GUARDA_SOL, font=fonte, fill="white")
    return img.resize((W, H), Image.LANCZOS)


if __name__ == "__main__":
    destino = RAIZ / "assets/images/pins"
    destino.mkdir(parents=True, exist_ok=True)
    for nome, cor in CORES.items():
        pin(cor).save(destino / f"pin-{nome}.png")
        print(destino / f"pin-{nome}.png")
