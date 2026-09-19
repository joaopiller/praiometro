import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

USER_AGENT = "Praiometro/2.0 (+https://github.com/joaopiller/praiometro)"


def criar_sessao(retries: int = 4, backoff_factor: float = 1.0) -> requests.Session:
    sessao = requests.Session()
    retry = Retry(
        total=retries,
        backoff_factor=backoff_factor,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET",),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    sessao.mount("http://", adapter)
    sessao.mount("https://", adapter)
    sessao.headers["User-Agent"] = USER_AGENT
    return sessao
