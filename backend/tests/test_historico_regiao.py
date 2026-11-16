import json
from pathlib import Path
from unittest.mock import MagicMock

from praiometro.coleta import historico, regiao
from praiometro.coleta.atualizador import atualizar_regiao

FIXTURE = Path(__file__).parent / "fixtures" / "historico_inea_2024.pdf"


def test_ler_historico_anual():
    dados = historico.ler_historico(FIXTURE)
    assert len(dados) == 29
    gr = dados["GR000"]
    # primeira coleta de 2024 em Gragoatá: 2/jan, própria; 5ª (15/jan) imprópria
    assert gr["2024-01-02"] is True
    assert gr["2024-01-15"] is False
    assert min(gr) >= "2024-01-01" and max(gr) <= "2024-12-31"
    assert any(d.startswith("2024-07") for d in gr)  # segunda página (jul-dez)


def test_link_do_ano():
    html = """
      <a href="https://x/niteroi_historico-4.pdf">2024</a>
      <a href="https://x/niteroi_historico-2.pdf">2026</a>
      <a href="https://x/outro.pdf">2026</a>
    """
    assert historico.link_do_ano(html, 2026) == "https://x/niteroi_historico-2.pdf"
    assert historico.link_do_ano(html, 2030) is None


def test_mesclar_historico_preserva_anos_anteriores():
    atual = {"GR000": {"2024-12-30": True}}
    novo = {"GR000": {"2025-01-02": False}, "BV001": {"2025-01-02": True}}
    assert historico.mesclar_historico(atual, novo) == {
        "GR000": {"2024-12-30": True, "2025-01-02": False},
        "BV001": {"2025-01-02": True},
    }


def test_extremos_da_mare():
    horas = [f"2026-11-16T{h:02d}:00" for h in range(12)]
    niveis = [0.0, 0.2, 0.3, 0.2, 0.0, -0.2, -0.3, -0.2, 0.0, 0.2, 0.3, 0.2]
    extremos = regiao.extremos_mare(horas, niveis)
    assert [e["tipo"] for e in extremos] == ["alta", "baixa", "alta"]
    assert extremos[0]["hora"] == "2026-11-16T02:00"
    assert extremos[1]["nivel"] == -0.3


def test_extremo_entre_duas_horas():
    horas = [f"2026-11-16T{h:02d}:00" for h in range(4)]
    extremos = regiao.extremos_mare(horas, [0.0, 0.3, 0.3, 0.0])
    assert extremos[0]["hora"] == "2026-11-16T01:30"


def test_extremos_com_lacunas():
    horas = [f"2026-11-16T{h:02d}:00" for h in range(4)]
    assert regiao.extremos_mare(horas, [None, 0.3, None, 0.1]) == []


def _resposta(json_):
    r = MagicMock()
    r.json.return_value = json_
    return r


def test_atualizar_regiao_mantem_dado_anterior_se_uma_consulta_falhar(settings):
    settings.regiao_file.parent.mkdir(parents=True, exist_ok=True)
    settings.regiao_file.write_text(json.dumps({"mare": {"serie": [], "extremos": [{"x": 1}]}}))
    sessao = MagicMock()
    sessao.get.side_effect = [
        _resposta({}),  # maré sem dados
        _resposta(
            {
                "daily": {
                    "time": ["2026-11-16"],
                    "sunrise": ["2026-11-16T05:00"],
                    "sunset": ["2026-11-16T18:14"],
                }
            }
        ),
    ]
    dados = atualizar_regiao(settings, sessao)
    assert dados["mare"]["extremos"] == [{"x": 1}]
    assert dados["sol"][0]["nascer"] == "2026-11-16T05:00"


def test_rotas_de_regiao_e_historico(client, settings):
    settings.regiao_file.write_text(
        json.dumps(
            {
                "mare": {
                    "serie": [{"hora": "2026-11-16T00:00", "nivel": 0.1}],
                    "extremos": [{"hora": "2026-11-16T05:30", "nivel": 0.29, "tipo": "alta"}],
                },
                "sol": [{"data": "2026-11-16", "nascer": "2026-11-16T05:00", "por": "2026-11-16T18:14"}],
            }
        )
    )
    from datetime import date, timedelta

    hoje = date.today()
    registros = {(hoje - timedelta(days=d)).isoformat(): d % 3 != 0 for d in range(1, 20)}
    registros["2000-01-01"] = False
    settings.historico_file.write_text(json.dumps({"GR000": registros, "IC000": {hoje.isoformat(): True}}))

    r = client.get("/regiao").json()
    assert r["mare"]["extremos"][0]["tipo"] == "alta"
    assert r["sol"][0]["por"].endswith("18:14")

    h = client.get("/pontos/GR000/historico").json()
    assert h["total"] == 19  # o registro de 2000 fica fora dos 365 dias
    assert h["proprias"] == sum(registros[d] for d in registros if d != "2000-01-01")
    assert h["registros"] == sorted(h["registros"], key=lambda x: x["data"])

    # IC00 usa o código do INEA (IC000)
    assert client.get("/pontos/IC00/historico").json()["total"] == 1
    assert client.get("/pontos/BV001/historico").json() == {
        "codigo": "BV001",
        "registros": [],
        "total": 0,
        "proprias": 0,
        "percentual_proprio": None,
    }


def test_regiao_sem_arquivo(client):
    assert client.get("/regiao").json() == {"mare": None, "sol": []}


def test_historico_com_link_relativo_e_download_cortado(tmp_path):
    pagina = MagicMock(text='<a href="/wp/niteroi_historico.pdf">2026</a>')
    pdf = MagicMock(content=b"%PDF-1.7 conteudo")
    sessao = MagicMock()
    sessao.get.side_effect = [pagina, pdf]
    destino = tmp_path / "historico.pdf"
    assert historico.baixar_historico(sessao, "https://inea.rj.gov.br/niteroi/", 2026, destino)
    assert sessao.get.call_args_list[1].args[0] == "https://inea.rj.gov.br/wp/niteroi_historico.pdf"
    assert destino.read_bytes() == b"%PDF-1.7 conteudo"
    # página de erro no lugar do PDF: o arquivo bom continua
    sessao.get.side_effect = [pagina, MagicMock(content=b"<html>erro</html>")]
    assert not historico.baixar_historico(sessao, "https://inea.rj.gov.br/niteroi/", 2026, destino)
    assert destino.read_bytes() == b"%PDF-1.7 conteudo"
