import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

USER_AGENT = "Praiometro/2.0 (+https://github.com/joaopiller/praiometro)"


class SessaoPelaPonte(requests.Session):
    """Faz os GET por uma ponte (ponte/api/buscar.js), que busca a página em nosso nome.

    Serve para hospedagens fora do Brasil: o INEA só responde a endereços brasileiros.
    """

    def __init__(self, ponte_url: str, chave: str):
        super().__init__()
        self.ponte_url = ponte_url
        self.chave = chave

    def get(self, url, **kwargs):
        # o endereço final (com os parâmetros) vai inteiro para a ponte
        destino = requests.Request("GET", url, params=kwargs.pop("params", None)).prepare().url
        cabecalhos = {**(kwargs.pop("headers", None) or {}), "x-ponte-chave": self.chave}
        # a ponte espera até 20 s pelo site; damos um pouco mais para ela responder
        kwargs["timeout"] = max(kwargs.get("timeout") or 0, 30)
        return super().get(self.ponte_url, params={"url": destino}, headers=cabecalhos, **kwargs)


def criar_sessao(
    retries: int = 2,
    backoff_factor: float = 1.0,
    ponte_url: str | None = None,
    ponte_chave: str | None = None,
) -> requests.Session:
    sessao = SessaoPelaPonte(ponte_url, ponte_chave or "") if ponte_url else requests.Session()
    retry = Retry(
        total=retries,
        backoff_factor=backoff_factor,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET",),
        raise_on_status=False,
        # um servidor que limita acessos pode mandar esperar horas (Retry-After); a espera travaria
        # a coleta inteira em silêncio. Melhor falhar logo e tentar de novo na próxima rodada
        respect_retry_after_header=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    sessao.mount("http://", adapter)
    sessao.mount("https://", adapter)
    sessao.headers["User-Agent"] = USER_AGENT
    return sessao
