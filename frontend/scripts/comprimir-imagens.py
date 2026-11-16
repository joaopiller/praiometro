"""Reduz as fotos das praias para o tamanho em que aparecem no app.

    python scripts/comprimir-imagens.py                 # assets/images/praias
    python scripts/comprimir-imagens.py --largura 1280 --qualidade 80 caminho/

Só mexe em imagens maiores que a largura máxima ou acima de 350 KB, e só
salva se economizar pelo menos 10%, então rodar de novo não piora o que já
foi otimizado.
Requer Pillow: pip install pillow
"""

import argparse
from pathlib import Path

from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
LIMITE_KB = 350


def comprimir(caminho: Path, largura: int, qualidade: int) -> tuple[int, int] | None:
    antes = caminho.stat().st_size
    with Image.open(caminho) as original:
        img = ImageOps.exif_transpose(original)  # respeita a rotação da câmera
        if img.width <= largura and antes <= LIMITE_KB * 1024:
            return None
        if img.width > largura:
            img = img.resize((largura, round(img.height * largura / img.width)), Image.LANCZOS)
        img = img.convert("RGB")
        destino = caminho.with_suffix(caminho.suffix + ".tmp")
        if caminho.suffix.lower() == ".webp":
            img.save(destino, "WEBP", quality=qualidade, method=6)
        else:
            img.save(destino, "JPEG", quality=qualidade, optimize=True, progressive=True)
    depois = destino.stat().st_size
    if depois > antes * 0.9:  # ganho pequeno não compensa recomprimir
        destino.unlink()
        return None
    destino.replace(caminho)
    return antes, depois


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("pasta", nargs="?", default=RAIZ / "assets/images/praias", type=Path)
    parser.add_argument("--largura", type=int, default=1280)
    parser.add_argument("--qualidade", type=int, default=80)
    args = parser.parse_args()

    total_antes = total_depois = 0
    for caminho in sorted(args.pasta.rglob("*")):
        if caminho.suffix.lower() not in (".jpg", ".jpeg", ".webp"):
            continue
        resultado = comprimir(caminho, args.largura, args.qualidade)
        if resultado is None:
            print(f"  ok        {caminho.relative_to(args.pasta)}")
            continue
        antes, depois = resultado
        total_antes += antes
        total_depois += depois
        print(f"  {antes // 1024:4d} KB -> {depois // 1024:4d} KB  {caminho.relative_to(args.pasta)}")
    if total_antes:
        print(f"economia: {(total_antes - total_depois) / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
