"""Verificação dos tokens de login (Google e Apple)."""

import base64
import json
import logging

import jwt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

log = logging.getLogger(__name__)

APPLE_ISSUER = "https://appleid.apple.com"
APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"


class TokenInvalidoError(Exception):
    pass


def _emissor(token: str) -> str:
    """Lê o `iss` sem validar, só para saber com quais chaves validar depois."""
    try:
        payload = token.split(".")[1]
        dados = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        return str(dados.get("iss", ""))
    except (IndexError, ValueError, TypeError) as e:
        raise TokenInvalidoError("token malformado") from e


class VerificadorTokens:
    """Devolve um identificador estável do usuário a partir do ID token.

    Contas Google mantêm o `sub` puro (compatível com os votos antigos);
    contas Apple ganham o prefixo `apple:` para nunca colidirem.
    """

    def __init__(self, google_client_id: str | None, apple_bundle_id: str | None):
        self.google_client_id = google_client_id
        self.apple_bundle_id = apple_bundle_id
        self._google_request = google_requests.Request()
        self._apple_chaves = jwt.PyJWKClient(APPLE_JWKS_URL, cache_keys=True, lifespan=24 * 60 * 60)
        if not google_client_id:
            log.warning(
                "GOOGLE_CLIENT_ID não definido: tokens de QUALQUER app Google serão aceitos. "
                "Defina-o em produção."
            )

    def __call__(self, token: str) -> str:
        if _emissor(token) == APPLE_ISSUER:
            return "apple:" + self._apple(token)
        return self._google(token)

    def _google(self, token: str) -> str:
        try:
            info = id_token.verify_oauth2_token(token, self._google_request, audience=self.google_client_id)
        except Exception as e:
            raise TokenInvalidoError(str(e)) from e
        return info["sub"]

    def _apple(self, token: str) -> str:
        if not self.apple_bundle_id:
            raise TokenInvalidoError("login com Apple não configurado")
        try:
            chave = self._apple_chaves.get_signing_key_from_jwt(token).key
            info = jwt.decode(
                token, chave, algorithms=["RS256"], audience=self.apple_bundle_id, issuer=APPLE_ISSUER
            )
        except Exception as e:
            raise TokenInvalidoError(str(e)) from e
        return info["sub"]
