"""Regressions for Unicode previews on legacy consoles (issue #487).

Run with the executor's Python dependencies installed:
    python scripts/test_console_encoding.py

Load BrowserThread's real methods through AST to avoid the executor's startup
side effects and browser/OCR dependencies. HTML parsing uses the production
code with a controlled browser; persistence is adapted to the production CSV
writer rather than running BrowserThread.saveData's other filesystem writes.
"""

import ast
import contextlib
import csv
from datetime import datetime
import io
from pathlib import Path
import sys
import tempfile
import threading
import time
from types import SimpleNamespace
import unittest
from urllib.parse import urljoin

from lxml import etree

EXECUTE_STAGE = Path(__file__).resolve().parents[1] / "ExecuteStage"
sys.path.insert(0, str(EXECUTE_STAGE))
import utils


def load_browser_methods():
    path = EXECUTE_STAGE / "easyspider_executestage.py"
    tree = ast.parse(path.read_text(encoding="utf-8"))
    browser = next(node for node in tree.body
                   if isinstance(node, ast.ClassDef) and node.name == "BrowserThread")
    methods = {"recordLog", "print_and_log", "getData", "executeNode"}
    browser.bases = []
    browser.body = [node for node in browser.body
                    if isinstance(node, ast.FunctionDef) and node.name in methods]
    module = ast.fix_missing_locations(ast.Module(body=[browser], type_ignores=[]))
    namespace = dict(vars(utils), datetime=datetime, etree=etree, time=time, urljoin=urljoin)
    exec(compile(module, str(path), "exec"), namespace)
    return namespace["BrowserThread"]


BrowserThread = load_browser_methods()


@contextlib.contextmanager
def encoded_output(encoding):
    raw = io.BytesIO()
    stream = io.TextIOWrapper(raw, encoding=encoding, errors="strict", newline="")
    try:
        yield stream, raw
    finally:
        stream.close()


class ConsoleEncodingTests(unittest.TestCase):
    def test_legacy_stream_escapes_once_and_preserves_print_formatting(self):
        for encoding in ("gbk", "ascii"):
            with self.subTest(encoding=encoding), encoded_output(encoding) as (stream, raw):
                utils.safe_print("prefix", "价格€😀", 42, sep="|", end="!", file=stream, flush=True)
                expected = "prefix|价格€😀|42!".encode(encoding, "backslashreplace")
                self.assertEqual(raw.getvalue(), expected)

    def test_unicode_streams_preserve_text_and_default_stdout(self):
        with encoded_output("utf-8") as (stream, raw):
            utils.safe_print("价格€😀", file=stream, flush=True)
            self.assertEqual(raw.getvalue().decode("utf-8"), "价格€😀\n")
        stream = io.StringIO()
        with contextlib.redirect_stdout(stream):
            utils.safe_print("价格€😀", "second", sep=None, end=None)
        self.assertEqual(stream.getvalue(), "价格€😀 second\n")

    def test_non_encoding_io_errors_propagate(self):
        for error in (BrokenPipeError("closed pipe"), OSError("write failed")):
            class BrokenStream:
                encoding = "gbk"

                def write(self, text):
                    raise error

            with self.subTest(error=type(error).__name__):
                with self.assertRaises(type(error)):
                    utils.safe_print("价格€😀", file=BrokenStream())

    def test_flush_is_requested_only_when_enabled(self):
        class FlushCountingStream(io.StringIO):
            def __init__(self):
                super().__init__()
                self.flush_calls = 0

            def flush(self):
                self.flush_calls += 1

        stream = FlushCountingStream()
        utils.safe_print("first", file=stream)
        self.assertEqual(stream.flush_calls, 0)
        utils.safe_print("second", file=stream, flush=True)
        self.assertEqual(stream.flush_calls, 1)

    def test_row_preview_preserves_full_values_and_record_flags(self):
        values = {"price": "€123456", "hidden": "😀secret"}
        with encoded_output("gbk") as (stream, raw), contextlib.redirect_stdout(stream):
            row = utils.new_line(values, 4, [True, False])
            stream.flush()
            self.assertEqual(raw.getvalue().decode("gbk"), "\\u20ac123  \n")
        self.assertEqual(row, ["€123456", "😀secret"])
        self.assertEqual(values, {"price": "€123456", "hidden": "😀secret"})

    def test_print_and_log_preserves_unicode_in_log(self):
        subject = BrowserThread()
        subject.logs = io.StringIO()
        with encoded_output("gbk") as (stream, raw), contextlib.redirect_stdout(stream):
            subject.print_and_log("price", "€😀", sep="|", end="!")
            self.assertEqual(raw.getvalue().decode("gbk"), "price|\\u20ac\\U0001f600!")
        self.assertTrue(subject.logs.getvalue().endswith("|price|€😀!"))
        subject.recordLog("€😀")
        self.assertTrue(subject.logs.getvalue().endswith(" €😀\n"))

    def test_extraction_node_saves_complete_unicode_rows_to_csv(self):
        for encoding in ("gbk", "ascii", "utf-8"):
            with self.subTest(encoding=encoding), tempfile.TemporaryDirectory() as directory:
                subject = BrowserThread()
                subject.shutdown_event = threading.Event()
                subject.event = threading.Event()
                subject.event.set()
                subject.logs = io.StringIO()
                subject.browser = SimpleNamespace(page_source="", iframe_env=False)
                subject.outputParameters = {"price": ""}
                subject.outputParametersRecord = [True]
                subject.maxViewLength = 100
                subject.OUTPUT = []
                subject.dataNotFoundKeys = {"price": False}
                subject.totalSteps = 0
                subject.startSteps = 0
                path = Path(directory) / "result.csv"

                def save_data():
                    utils.write_to_csv(path, subject.OUTPUT, subject.outputParametersRecord)
                    subject.OUTPUT.clear()

                subject.saveData = save_data
                subject.procedure = [{
                    "title": "提取数据", "option": 3, "isInLoop": False,
                    "parameters": {
                        "clear": 0, "recordASField": 1, "newLine": True,
                        "waitElement": "", "wait": 0, "waitType": 0,
                        "params": [{
                            "name": "price", "optimizable": True, "iframe": False,
                            "relativeXPath": "/html/body/div", "relative": False,
                            "nodeType": 0, "contentType": 0, "default": "",
                        }],
                    },
                }]
                samples = ["Price€ 20", "价格😀 30"]
                with encoded_output(encoding) as (stream, raw), contextlib.redirect_stdout(stream):
                    for value in samples:
                        subject.browser.page_source = f"<html><body><div>{value}</div></body></html>"
                        subject.executeNode(0)
                    stream.flush()
                    self.assertNotIn("Error executing node", raw.getvalue().decode(encoding))
                self.assertEqual(subject.totalSteps, len(samples))
                with path.open(encoding="utf-8-sig", newline="") as saved:
                    self.assertEqual(list(csv.reader(saved)), [[value] for value in samples])


if __name__ == "__main__":
    unittest.main(verbosity=2)
