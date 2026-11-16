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

    def download(self, url, content_type=None):
        session = Mock()
        headers = {} if content_type is None else {"Content-Type": content_type}
        session.get.return_value = SimpleNamespace(
            status_code=200, content=PNG,
            headers=utils.requests.structures.CaseInsensitiveDict(headers))
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

    def test_issue_448_url_without_extension_uses_content_type(self):
        saved = self.download("https://example.com/images/a1b2c3d4", "image/png")
        self.assertRegex(
            saved.name,
            r"^a1b2c3d4\.png_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_a1b2c3d4\.png$",
        )

    def test_content_type_parameters_and_case_are_ignored(self):
        saved = self.download("https://example.com/images/a1b2c3d4", "Image/JPEG; charset=binary")
        self.assertEqual(saved.suffix, ".jpg")

    def test_url_extension_is_kept_when_content_type_differs(self):
        saved = self.download("https://example.com/photo.jpg?format=webp", "image/webp")
        self.assertEqual(saved.suffix, ".jpg")
        saved.unlink()
        saved = self.download("https://example.com/PHOTO.JPEG", "image/png")
        self.assertTrue(saved.name.endswith("_PHOTO.JPEG"))

    def test_non_image_url_suffix_gets_the_image_extension(self):
        for url, content_type, name in (
                ("https://example.com/show.php?id=7", "image/png", "show.php.png"),
                ("https://example.com/photo.jpg!small", "image/jpeg", "photo.jpg!small.jpg"),
                ("https://example.com/v1.2/render.aspx", "image/webp", "render.aspx.webp")):
            with self.subTest(url=url):
                saved = self.download(url, content_type)
                self.assertTrue(saved.name.startswith(name + "_"), saved.name)
                self.assertTrue(saved.name.endswith("_" + name), saved.name)
                saved.unlink()

    def test_non_image_content_type_adds_no_extension(self):
        for content_type in (None, "application/octet-stream", "text/html"):
            with self.subTest(content_type=content_type):
                saved = self.download("https://example.com/images/a1b2c3d4", content_type)
                self.assertTrue(saved.name.endswith("_a1b2c3d4"))
                saved.unlink()

    def test_empty_path_fallback_name_uses_content_type(self):
        saved = self.download("https://example.com/", "image/gif")
        self.assertTrue(saved.name.startswith("image.gif_"))
        self.assertEqual(saved.suffix, ".gif")

    def test_long_filename_without_extension_keeps_added_extension(self):
        saved = self.download("https://example.com/" + "a" * 300, "image/webp")
        self.assertEqual(saved.suffix, ".webp")

    def test_data_url_uses_its_image_type(self):
        encoded = base64.b64encode(PNG).decode("ascii")
        for media_type, suffix in (("image/jpeg", ".jpg"), ("image/png", ".png"),
                                   ("image/webp", ".webp"), ("image/x-unknown", ".png")):
            with self.subTest(media_type=media_type), tempfile.TemporaryDirectory() as directory:
                utils.download_image(self.browser, "data:{};base64,{}".format(media_type, encoded),
                                     directory)
                files = list(Path(directory).iterdir())
                self.assertEqual(len(files), 1)
                self.assertEqual(files[0].suffix, suffix)
                self.assertEqual(files[0].read_bytes(), PNG)

    def test_element_screenshot_without_url_extension_is_saved_as_png(self):
        session = Mock()
        session.get.return_value = SimpleNamespace(
            status_code=403, content=b"forbidden",
            headers=utils.requests.structures.CaseInsensitiveDict({"Content-Type": "text/html"}))
        self.browser.browser.execute_script.return_value = None
        element = Mock()
        element.screenshot.side_effect = lambda path: Path(path).write_bytes(PNG)
        with patch.object(utils.requests, "session", return_value=session):
            utils.download_image(self.browser, "https://example.com/images/a1b2c3d4",
                                 self.directory.name, element)
        element.screenshot.assert_called_once()
        files = list(self.output.iterdir())
        self.assertEqual(len(files), 1)
        self.assertTrue(files[0].name.startswith("a1b2c3d4.png_"))
        self.assertEqual(files[0].suffix, ".png")

    def test_repeated_downloads_remain_unique(self):
        session = Mock()
        session.get.return_value = SimpleNamespace(
            status_code=200, content=PNG,
            headers=utils.requests.structures.CaseInsensitiveDict({"Content-Type": "image/jpeg"}))
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

    def test_issue_448_over_http_adds_extension_from_response(self):
        class ImageHandler(BaseHTTPRequestHandler):
            def do_GET(self):
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
            url = "http://127.0.0.1:{}/thumb/8f3a2c?w=480".format(server.server_port)
            utils.download_image(self.browser, url, self.directory.name)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)
        files = list(self.output.iterdir())
        self.assertEqual(len(files), 1, self.browser.print_and_log.call_args_list)
        self.assertEqual(files[0].read_bytes(), PNG)
        self.assertTrue(files[0].name.startswith("8f3a2c.png_"))
        self.assertEqual(files[0].suffix, ".png")


if __name__ == "__main__":
    unittest.main(verbosity=2)
