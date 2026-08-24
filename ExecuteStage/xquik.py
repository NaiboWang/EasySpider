import os

import requests


SEARCH_URL = "https://xquik.com/api/v1/x/tweets/search"
MAX_RESULTS = 10000
MAX_TIMEOUT_SECONDS = 300


class XquikSearchError(RuntimeError):
    """Raised when a Xquik search cannot return a usable response."""


def _require_integer(value, name, minimum, maximum):
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"{name} must be an integer")
    if value < minimum or value > maximum:
        raise ValueError(f"{name} must be between {minimum} and {maximum}")
    return value


def search_tweets(
    query,
    query_type="Latest",
    limit=100,
    cursor="",
    timeout=30,
    api_key=None,
    request_get=None,
):
    query = str(query).strip()
    if not query:
        raise ValueError("query is required")
    if not isinstance(query_type, str) or query_type not in {"Latest", "Top"}:
        raise ValueError("query_type must be Latest or Top")

    limit = _require_integer(limit, "limit", 1, MAX_RESULTS)
    timeout = _require_integer(timeout, "timeout", 1, MAX_TIMEOUT_SECONDS)
    api_key = api_key or os.environ.get("XQUIK_API_KEY", "")
    if not isinstance(api_key, str):
        raise ValueError("api_key must be text")
    api_key = api_key.strip()
    if not api_key:
        raise XquikSearchError("Set XQUIK_API_KEY before starting EasySpider")

    params = {"q": query, "queryType": query_type, "limit": limit}
    cursor = str(cursor).strip()
    if cursor:
        params["cursor"] = cursor

    if request_get is None:
        request_get = requests.get
    try:
        response = request_get(
            SEARCH_URL,
            headers={"Accept": "application/json", "x-api-key": api_key},
            params=params,
            timeout=timeout,
        )
    except requests.RequestException as error:
        raise XquikSearchError(
            "Could not reach Xquik. Check the network and retry"
        ) from error

    status = response.status_code
    if status == 401:
        raise XquikSearchError("Xquik authentication failed. Check XQUIK_API_KEY")
    if status == 402:
        raise XquikSearchError(
            "Xquik credits are unavailable. Check the Xquik dashboard"
        )
    if status == 429:
        raise XquikSearchError("Xquik rate limit reached. Retry later")
    if status < 200 or status >= 300:
        raise XquikSearchError(f"Xquik request failed with HTTP {status}")

    try:
        payload = response.json()
    except ValueError as error:
        raise XquikSearchError("Xquik returned invalid JSON") from error
    if not isinstance(payload, dict) or not isinstance(payload.get("tweets"), list):
        raise XquikSearchError("Xquik returned an invalid tweet-search response")
    for tweet in payload["tweets"]:
        if not isinstance(tweet, dict):
            raise XquikSearchError("Xquik returned an invalid tweet-search response")
        if "id" in tweet and not isinstance(tweet["id"], str):
            raise XquikSearchError("Xquik returned a non-string Tweet ID")
    if "has_next_page" in payload and not isinstance(payload["has_next_page"], bool):
        raise XquikSearchError("Xquik returned invalid pagination metadata")
    if (
        "next_cursor" in payload
        and payload["next_cursor"] is not None
        and not isinstance(payload["next_cursor"], str)
    ):
        raise XquikSearchError("Xquik returned invalid pagination metadata")
    return payload
