import time
from types import SimpleNamespace
from unittest.mock import patch

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from praiometro.auth import APPLE_ISSUER, TokenInvalidoError, VerificadorTokens

BUNDLE = "com.praiometro.app"
CHAVE = rsa.generate_private_key(public_exponent=65537, key_size=2048)
# só para montar tokens de teste do Google; a validação real é mockada
SEGREDO = "x" * 64
OUTRA_CHAVE = rsa.generate_private_key(public_exponent=65537, key_size=2048)


def token_apple(**mudancas):
    dados = {
        "iss": APPLE_ISSUER,
        "aud": BUNDLE,
        "sub": "000123.abc",
        "exp": int(time.time()) + 600,
        **mudancas,
    }
    return jwt.encode(dados, CHAVE, algorithm="RS256", headers={"kid": "k1"})


@pytest.fixture
def verificador():
    v = VerificadorTokens("web-client-id", BUNDLE)
    # as chaves públicas da Apple viriam de appleid.apple.com/auth/keys
    v._apple_chaves = SimpleNamespace(
        get_signing_key_from_jwt=lambda _t: SimpleNamespace(key=CHAVE.public_key())
    )
    return v


def test_token_apple_valido_ganha_prefixo(verificador):
    assert verificador(token_apple()) == "apple:000123.abc"


@pytest.mark.parametrize(
    "mudancas",
    [
        {"aud": "com.outro.app"},
        {"exp": int(time.time()) - 10},
    ],
)
def test_token_apple_invalido(verificador, mudancas):
    with pytest.raises(TokenInvalidoError):
        verificador(token_apple(**mudancas))


def test_token_apple_assinado_por_outra_chave(verificador):
    falso = jwt.encode(
        {"iss": APPLE_ISSUER, "aud": BUNDLE, "sub": "x", "exp": int(time.time()) + 600},
        OUTRA_CHAVE,
        algorithm="RS256",
    )
    with pytest.raises(TokenInvalidoError):
        verificador(falso)


def test_apple_sem_bundle_configurado():
    v = VerificadorTokens("web-client-id", None)
    with pytest.raises(TokenInvalidoError):
        v(token_apple())


def test_token_google_mantem_sub_puro(verificador):
    token = jwt.encode({"iss": "https://accounts.google.com", "sub": "1234"}, SEGREDO, algorithm="HS256")
    with patch("praiometro.auth.id_token.verify_oauth2_token", return_value={"sub": "1234"}) as verificar:
        assert verificador(token) == "1234"
    assert verificar.call_args.kwargs["audience"] == "web-client-id"


def test_token_google_invalido(verificador):
    token = jwt.encode({"iss": "accounts.google.com", "sub": "1"}, SEGREDO, algorithm="HS256")
    with (
        patch("praiometro.auth.id_token.verify_oauth2_token", side_effect=ValueError("expirado")),
        pytest.raises(TokenInvalidoError),
    ):
        verificador(token)


@pytest.mark.parametrize("token", ["", "lixo", "a.b", "a.%%%.c"])
def test_token_malformado(verificador, token):
    with pytest.raises(TokenInvalidoError):
        verificador(token)
