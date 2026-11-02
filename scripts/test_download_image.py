"""Regression tests for downloaded image filenames; no browser is required.

Run from the repository root with: python scripts/test_download_image.py
The imports use the requests, beautifulsoup4, openpyxl, pymysql and lxml
dependencies already listed in ExecuteStage/requirements.txt.
"""

import base64
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import sys
import tempfile
import threading
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "ExecuteStage"))
import utils


PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jhZkAAAAASUVORK5CYII="
)
IMAGE_NAME = "b7c7ec0f7e9d4c0dbf112a116bf1f50f~tplv-f042mdwyw7-original:480:0.webp"


class DownloadImageTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.output = Path(self.directory.name)
        self.browser = SimpleNamespace(
            browser=Mock(),
            print_and_log=Mock(),
        )
        self.browser.browser.get_cookies.return_value = [
            {"name": "session", "value": "test-token"},
        ]

    def download(self, url):
        session = Mock()
        session.get.return_value = SimpleNamespace(status_code=200, content=PNG)
        with patch.object(utils.requests, "session", return_value=session):
            utils.download_image(self.browser, url, self.directory.name)
        session.get.assert_called_once()
        self.assertEqual(session.get.call_args.args[0], url)
        self.assertIn("User-Agent", session.get.call_args.kwargs["headers"])
        session.cookies.set.assert_called_once_with("session", "test-token")
        files = list(self.output.iterdir())
        self.assertEqual(len(files), 1, self.browser.print_and_log.call_args_list)
        saved = files[0]
        self.assertEqual(saved.read_bytes(), PNG)
        self.assertNotRegex(saved.name, r'[<>:"/\\|?*\x00-\x1f]')
        self.assertFalse(saved.name.endswith((".", " ")))
        self.assertLessEqual(len(saved.name.encode("utf-8")), 200)
        return saved

    def test_simple_filename_keeps_existing_naming_format(self):
        saved = self.download("https://example.com/photo.jpg")
        self.assertRegex(
            saved.name,
            r"^photo\.jpg_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_photo\.jpg$",
        )

    def test_issue_897_colons(self):
        saved = self.download("https://example.com/" + IMAGE_NAME)
        self.assertTrue(saved.name.endswith(IMAGE_NAME.replace(":", "_")))

    def test_windows_device_names_are_prefixed(self):
        for name in ("con.png", "NUL.jpeg", "COM1.jpg", "LPT1.webp", "COM¹.png", "LPT².jpg"):
            with self.subTest(name=name):
                saved = self.download("https://example.com/" + name)
                self.assertTrue(saved.name.startswith("_" + name + "_"))
                saved.unlink()

    def test_name_starting_with_device_name_is_not_changed(self):
        saved = self.download("https://example.com/console.png")
        self.assertTrue(saved.name.startswith("console.png_"))

    def test_query_slashes_and_fragment_do_not_become_the_filename(self):
        saved = self.download("https://example.com/photo.jpg?size=800/600#preview/detail")
        self.assertTrue(saved.name.startswith("photo.jpg_"))
        self.assertEqual(saved.suffix, ".jpg")

    def test_fragment_is_excluded_without_query(self):
        saved = self.download("https://example.com/photo.jpg#preview")
        self.assertEqual(saved.suffix, ".jpg")

    def test_semicolon_in_path_is_preserved(self):
        saved = self.download("https://example.com/photo;version.png?size=2")
        self.assertTrue(saved.name.startswith("photo;version.png_"))
        self.assertEqual(saved.suffix, ".png")

    def test_percent_encoded_characters_are_decoded_and_sanitized(self):
        saved = self.download("https://example.com/photo%20%3C%3E%3A%22%2F%5C%7C%3F%2A%00%1F.png")
        self.assertTrue(saved.name.startswith("photo " + "_" * 11 + ".png_"))
        self.assertEqual(saved.suffix, ".png")

    def test_decoding_does_not_turn_encoded_slashes_into_directories(self):
        saved = self.download("https://example.com/%2E%2E%2Fphoto.jpg")
        self.assertTrue(saved.name.endswith(".._photo.jpg"))
        self.assertEqual(saved.parent, self.output)

    def test_empty_path_and_dot_only_filenames_have_a_fallback(self):
        for ending in ("", "/", "/...", "/%20%2E"):
            with self.subTest(ending=ending):
                saved = self.download("https://example.com" + ending)
                self.assertTrue(saved.name.startswith("image_"))
                saved.unlink()

    def test_trailing_dots_and_spaces_are_removed(self):
        saved = self.download("https://example.com/photo.png.%20")
        self.assertEqual(saved.suffix, ".png")

    def test_long_ascii_filename_preserves_image_extension(self):
        saved = self.download("https://example.com/" + "a" * 300 + ".webp")
        self.assertEqual(saved.suffix, ".webp")

    def test_long_unicode_filename_preserves_image_extension(self):
        saved = self.download("https://example.com/" + "图片" * 100 + ".png")
        self.assertEqual(saved.suffix, ".png")
        self.assertIn("图片", saved.name)

    def test_repeated_downloads_remain_unique(self):
        session = Mock()
        session.get.return_value = SimpleNamespace(status_code=200, content=PNG)
        with patch.object(utils.requests, "session", return_value=session):
            for _ in range(2):
                utils.download_image(self.browser, "https://example.com/photo.jpg", self.directory.name)
        files = list(self.output.iterdir())
        self.assertEqual(len(files), 2)
        for saved in files:
            self.assertEqual(saved.read_bytes(), PNG)

    def test_issue_897_over_http_preserves_query_and_browser_cookie(self):
        received = []

        class ImageHandler(BaseHTTPRequestHandler):
            def do_GET(self):
                received.append((self.path, self.headers.get("Cookie")))
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.send_header("Content-Length", str(len(PNG)))
                self.end_headers()
                self.wfile.write(PNG)

            def log_message(self, *args):
                pass

        server = HTTPServer(("127.0.0.1", 0), ImageHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            request_path = "/" + IMAGE_NAME + "?resize=480/0&token=example%2Ftoken"
            url = "http://127.0.0.1:{}{}".format(server.server_port, request_path)
            utils.download_image(self.browser, url, self.directory.name)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)
        self.assertEqual(received, [(request_path, "session=test-token")])
        files = list(self.output.iterdir())
        self.assertEqual(len(files), 1, self.browser.print_and_log.call_args_list)
        self.assertEqual(files[0].read_bytes(), PNG)
        self.assertTrue(files[0].name.endswith(IMAGE_NAME.replace(":", "_")))


if __name__ == "__main__":
    unittest.main(verbosity=2)
