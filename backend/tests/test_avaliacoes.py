from datetime import UTC, datetime, timedelta

from praiometro.avaliacoes import gravar_snapshot_medias

VOTOS = {"limpeza": 5, "acessibilidade": 4, "infraestrutura": 3, "seguranca": 2, "tranquilidade": 1}
TRINTA_DIAS = timedelta(days=30)


def test_registrar_e_resumir(repo):
    assert repo.resumo("GR000") is None
    assert repo.registrar("GR000", "u1", VOTOS, TRINTA_DIAS).registrado
    resumo = repo.resumo("GR000")
    assert resumo.total == 1
    assert resumo.estrelas == VOTOS


def test_pode_votar_de_novo_apos_intervalo(repo, colecao):
    antes = datetime(2026, 1, 1, tzinfo=UTC)
    repo.registrar("GR000", "u1", VOTOS, TRINTA_DIAS, agora=antes)
    bloqueado = repo.registrar("GR000", "u1", VOTOS, TRINTA_DIAS, agora=antes + timedelta(days=10))
    assert not bloqueado.registrado
    assert bloqueado.pode_votar_em.isoformat() == "2026-01-31"

    novos = dict.fromkeys(VOTOS, 1)
    assert repo.registrar("GR000", "u1", novos, TRINTA_DIAS, agora=antes + timedelta(days=31)).registrado
    assert colecao.count_documents({}) == 1
    assert repo.resumo("GR000").estrelas == novos


def test_timestamp_legado_sem_fuso(repo, colecao):
    colecao.insert_one(
        {"praia_id": "GR000", "user_id": "u1", "votos": VOTOS, "timestamp": "2020-01-01T00:00:00"}
    )
    assert repo.registrar("GR000", "u1", VOTOS, TRINTA_DIAS).registrado


def test_snapshot_grava_medias_no_estado(repo, settings, estado):
    repo.registrar("GR000", "u1", VOTOS, TRINTA_DIAS)
    assert gravar_snapshot_medias(repo, settings.estado_file) == 1
    import json

    gravado = json.loads(settings.estado_file.read_text(encoding="utf-8"))
    assert gravado["GR000"]["avaliacao_media"] == VOTOS
    assert gravado["GR000"]["total_avaliacoes"] == 1
    assert "avaliacao_media" not in gravado["BV001"]
