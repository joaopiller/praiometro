"""Verificação do ID token do Google Sign-In."""

import logging

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

log = logging.getLogger(__name__)


class TokenInvalidoError(Exception):
    pass


class VerificadorGoogle:
    def __init__(self, client_id: str | None):
        self.client_id = client_id
        self._request = google_requests.Request()
        if not client_id:
            log.warning(
                "GOOGLE_CLIENT_ID não definido: tokens de QUALQUER app Google serão aceitos. "
                "Defina-o em produção."
            )

    def __call__(self, token: str) -> str:
        """Retorna o `sub` (id do usuário no Google)."""
        try:
            info = id_token.verify_oauth2_token(token, self._request, audience=self.client_id)
        except Exception as e:
            raise TokenInvalidoError(str(e)) from e
        return info["sub"]
