import urllib.error
from unittest.mock import MagicMock, patch

from ases.config.settings import Settings
from ases.transport.client import APIClient


def _settings():
    return Settings(api_key="ases_test_key", endpoint="https://api.example.com", environment="production")


def test_send_succeeds_on_202():
    client = APIClient(_settings())
    mock_response = MagicMock()
    mock_response.getcode.return_value = 202
    mock_response.__enter__.return_value = mock_response

    with patch("ases.transport.client.urllib.request.urlopen", return_value=mock_response):
        result = client.send('{"events": []}')

    assert result is True


def test_send_fails_fast_on_4xx_without_retrying():
    client = APIClient(_settings())
    call_count = {"n": 0}

    def raise_http_error(*args, **kwargs):
        call_count["n"] += 1
        raise urllib.error.HTTPError(
            url="https://api.example.com/api/v1/observations",
            code=401,
            msg="Unauthorized",
            hdrs=None,
            fp=None,
        )

    with patch("ases.transport.client.urllib.request.urlopen", side_effect=raise_http_error):
        result = client.send('{"events": []}')

    assert result is False
    assert call_count["n"] == 1  # no retry on a 4xx — it will not succeed on retry


def test_send_retries_on_network_error_then_gives_up(monkeypatch):
    monkeypatch.setattr("ases.transport.client.time.sleep", lambda seconds: None)
    client = APIClient(_settings())

    def raise_url_error(*args, **kwargs):
        raise urllib.error.URLError("connection refused")

    with patch("ases.transport.client.urllib.request.urlopen", side_effect=raise_url_error) as mock_urlopen:
        result = client.send('{"events": []}')

    assert result is False
    assert mock_urlopen.call_count == 4  # 1 initial attempt + TRANSPORT_MAX_RETRIES (3)


def test_authorization_header_uses_bearer_scheme():
    client = APIClient(_settings())
    headers = client._build_headers()
    assert headers["Authorization"] == "Bearer ases_test_key"
    assert headers["Content-Type"] == "application/json"
