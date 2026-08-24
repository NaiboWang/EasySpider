import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import requests


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "ExecuteStage"))

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]

from xquik import SEARCH_URL, XquikSearchError, search_tweets


class FakeResponse:
    def __init__(self, status_code=200, payload=None, json_error=None):
        self.status_code = status_code
        self.payload = payload
        self.json_error = json_error

    def json(self):
        if self.json_error is not None:
            raise self.json_error
        return self.payload


class XquikSearchTests(unittest.TestCase):
    def test_search_sends_bounded_request_and_returns_payload(self):
        calls = []
        payload = {
            "tweets": [{"id": "1893704267862470862", "text": "Hello"}],
            "has_next_page": True,
            "next_cursor": "opaque-cursor",
        }

        def fake_get(url, **kwargs):
            calls.append((url, kwargs))
            return FakeResponse(payload=payload)

        result = search_tweets(
            "from:example",
            query_type="Top",
            limit=250,
            cursor=" next-page ",
            timeout=45,
            api_key="secret-key",
            request_get=fake_get,
        )

        self.assertEqual(result, payload)
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0][0], SEARCH_URL)
        self.assertEqual(
            calls[0][1]["params"],
            {
                "q": "from:example",
                "queryType": "Top",
                "limit": 250,
                "cursor": "next-page",
            },
        )
        self.assertEqual(calls[0][1]["timeout"], 45)
        self.assertEqual(calls[0][1]["headers"]["x-api-key"], "secret-key")
        self.assertNotIn("secret-key", json.dumps(result))

    def test_search_reads_api_key_from_environment(self):
        captured = []

        def fake_get(_url, **kwargs):
            captured.append(kwargs)
            return FakeResponse(payload={"tweets": []})

        with patch.dict(os.environ, {"XQUIK_API_KEY": "environment-key"}, clear=True):
            search_tweets("EasySpider", request_get=fake_get)

        self.assertEqual(captured[0]["headers"]["x-api-key"], "environment-key")
        self.assertNotIn("cursor", captured[0]["params"])

    def test_search_rejects_invalid_inputs_before_request(self):
        cases = [
            {"query": ""},
            {"query": "test", "query_type": "Recent"},
            {"query": "test", "query_type": []},
            {"query": "test", "limit": True},
            {"query": "test", "limit": 0},
            {"query": "test", "limit": 10001},
            {"query": "test", "timeout": 0},
            {"query": "test", "timeout": 301},
        ]

        for values in cases:
            with self.subTest(values=values):
                with self.assertRaises(ValueError):
                    search_tweets(api_key="key", **values)

    def test_search_requires_environment_key(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(XquikSearchError, "XQUIK_API_KEY"):
                search_tweets("test")

    def test_search_maps_safe_http_errors(self):
        expected = {
            401: "authentication failed",
            402: "credits are unavailable",
            429: "rate limit reached",
            503: "HTTP 503",
        }

        for status, message in expected.items():
            with self.subTest(status=status):
                with self.assertRaisesRegex(XquikSearchError, message):
                    search_tweets(
                        "test",
                        api_key="secret-key",
                        request_get=lambda *_args, **_kwargs: FakeResponse(
                            status_code=status,
                            payload={"private": "response body"},
                        ),
                    )

    def test_search_maps_connection_errors_without_secret(self):
        def fail_request(*_args, **_kwargs):
            raise requests.ConnectionError("request failed with secret-key")

        with self.assertRaises(XquikSearchError) as context:
            search_tweets(
                "test", api_key="secret-key", request_get=fail_request
            )

        self.assertNotIn("secret-key", str(context.exception))

    def test_search_rejects_invalid_json_and_response_shape(self):
        responses = [
            FakeResponse(json_error=ValueError("bad json")),
            FakeResponse(payload=[]),
            FakeResponse(payload={"tweets": {}}),
            FakeResponse(payload={"tweets": [{"id": 1893704267862470862}]}),
            FakeResponse(payload={"tweets": [], "has_next_page": "yes"}),
            FakeResponse(payload={"tweets": [], "next_cursor": 12}),
        ]

        for response in responses:
            with self.subTest(response=response.payload):
                with self.assertRaises(XquikSearchError):
                    search_tweets(
                        "test",
                        api_key="key",
                        request_get=lambda *_args, **_kwargs: response,
                    )


class XquikIntegrationFilesTests(unittest.TestCase):
    def test_action_is_wired_into_both_editors_and_runtime(self):
        english = (
            REPOSITORY_ROOT / "ElectronJS/src/taskGrid/FlowChart.html"
        ).read_text(encoding="utf-8")
        chinese = (
            REPOSITORY_ROOT / "ElectronJS/src/taskGrid/FlowChart_CN.html"
        ).read_text(encoding="utf-8")
        logic = (
            REPOSITORY_ROOT / "ElectronJS/src/taskGrid/FlowChart.js"
        ).read_text(encoding="utf-8")
        executor = (
            REPOSITORY_ROOT / "ExecuteStage/easyspider_executestage.py"
        ).read_text(encoding="utf-8")

        self.assertIn(
            '<option :value = 13>Search X posts with Xquik</option>', english
        )
        self.assertIn(
            '<option :value = 13>使用 Xquik 搜索 X 帖子</option>', chinese
        )
        self.assertIn("case 13:", logic)
        self.assertIn("elif codeMode == 13:", executor)
        self.assertNotIn(
            'v-model=\'nowNode["parameters"]["xquik"]["apiKey"]\'', english
        )


if __name__ == "__main__":
    unittest.main()
