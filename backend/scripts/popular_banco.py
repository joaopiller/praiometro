"""Popula o MongoDB com votos falsos para desenvolvimento.

Uso:  python scripts/popular_banco.py [--usuarios 20] [--votos-por-usuario 5] [--limpar]
"""

import argparse
import random
from datetime import UTC, datetime, timedelta

from praiometro.avaliacoes import CRITERIOS
from praiometro.catalogo import carregar_catalogo
from praiometro.config import get_settings
from praiometro.db import criar_colecao_votos
from praiometro.praias import agrupar


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--usuarios", type=int, default=20)
    parser.add_argument("--votos-por-usuario", type=int, default=5)
    parser.add_argument("--limpar", action="store_true", help="apaga TODOS os votos antes")
    args = parser.parse_args()

    settings = get_settings()
    colecao = criar_colecao_votos(settings)
    praias = list(agrupar(carregar_catalogo(settings.catalogo_file)))

    if args.limpar:
        colecao.delete_many({})

    docs = []
    for i in range(args.usuarios):
        for praia_id in random.sample(praias, min(args.votos_por_usuario, len(praias))):
            quando = datetime.now(UTC) - timedelta(days=random.randint(0, 30))
            docs.append(
                {
                    "user_id": f"mock_user_{i}",
                    "praia_id": praia_id,
                    "votos": {c: random.randint(1, 5) for c in CRITERIOS},
                    "timestamp": quando.isoformat(),
                }
            )
    for d in docs:
        colecao.update_one({"user_id": d["user_id"], "praia_id": d["praia_id"]}, {"$set": d}, upsert=True)
    print(f"{len(docs)} votos falsos gravados em {settings.mongo_db}.votos")


if __name__ == "__main__":
    main()
