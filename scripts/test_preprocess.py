"""Regression tests for extraction preprocessing, without launching a browser.

Run with: python scripts/test_preprocess.py

The executor imports browser/OCR dependencies and initializes runtime directories
at module scope. Load its actual preprocess method and pure utility functions
from the source AST to exercise preprocessing with only the standard library.
These tests do not cover browser startup or crawling a live page.
"""

import ast
import copy
from enum import IntEnum, unique
from pathlib import Path
import re
from types import SimpleNamespace
import unittest


ROOT = Path(__file__).resolve().parents[1]


def load_preprocess():
    namespace = {"IntEnum": IntEnum, "unique": unique, "re": re}
    selections = (
        ("constants.py", ("GraphOption",)),
        ("utils.py", ("detect_optimizable", "lowercase_tags_in_xpath")),
        ("easyspider_executestage.py", ("preprocess",)),
    )
    for filename, names in selections:
        path = ROOT / "ExecuteStage" / filename
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        nodes = tree.body
        if filename == "easyspider_executestage.py":
            nodes = next(node for node in nodes
                         if isinstance(node, ast.ClassDef)
                         and node.name == "BrowserThread").body
        selected = [node for node in nodes if getattr(node, "name", None) in names]
        if len(selected) != len(names):
            raise RuntimeError(f"Could not find {names} in {path}")
        exec(compile(ast.Module(body=selected, type_ignores=[]), str(path), "exec"),
             namespace)
    return namespace["preprocess"]


PREPROCESS = load_preprocess()


def field(name="title"):
    return {
        "name": name,
        "relativeXPath": "/SPAN",
        "nodeType": 1,
        "contentType": 0,
        "relative": True,
        "default": "",
        "beforeJS": "",
        "afterJS": "",
        "recordASField": 1,
    }


class PreprocessTests(unittest.TestCase):
    def preprocess(self, extraction, loop_type, loop_first, loop_overrides=None):
        extract = {
            "option": 3,
            "sequence": [],
            "parameters": copy.deepcopy(extraction),
        }
        loop = {
            "option": 8,
            "title": "Extract rows",
            "sequence": [1 if loop_first else 0],
            "parameters": {
                "loopType": loop_type,
                "xpath": "//LI",
                "pathList": "//li[1]\n//li[2]",
                **(loop_overrides or {}),
            },
        }
        procedure = [loop, extract] if loop_first else [extract, loop]
        worker = SimpleNamespace(procedure=procedure, task_version="0.6.3",
                                 print_and_log=lambda *args: None)
        PREPROCESS(worker)
        return loop["parameters"], extract["parameters"]

    def assert_empty_extraction(self, extraction):
        for loop_type in (1, 2):
            for loop_first in (True, False):
                with self.subTest(loop_type=loop_type, loop_first=loop_first):
                    loop, extract = self.preprocess(extraction, loop_type, loop_first)
                    self.assertEqual(extract["params"], [])
                    self.assertEqual(extract["recordASField"], 0)
                    # An empty extraction must follow the normal no-output path;
                    # the quick path would append rows of stale field values.
                    self.assertFalse(loop["quickExtractable"])
                    self.assertNotIn("quickParams", loop)

    def assert_populated_extraction(self, extraction, expected_name):
        for loop_type in (1, 2):
            for loop_first in (True, False):
                with self.subTest(loop_type=loop_type, loop_first=loop_first):
                    loop, extract = self.preprocess(extraction, loop_type, loop_first)
                    self.assertTrue(loop["quickExtractable"])
                    self.assertEqual([p["name"] for p in extract["params"]],
                                     [expected_name])
                    self.assertEqual([p["name"] for p in loop["quickParams"]],
                                     [expected_name])
                    self.assertEqual(loop["baseXPath"], "//li" if loop_type == 1
                                     else "//li[1]\n//li[2]")

    def test_empty_current_params(self):
        self.assert_empty_extraction({"params": []})

    def test_empty_legacy_paras(self):
        self.assert_empty_extraction({"paras": []})

    def test_empty_current_params_override_legacy_fields(self):
        self.assert_empty_extraction({"params": [], "paras": [field("old")]})

    def test_populated_current_params(self):
        self.assert_populated_extraction({"params": [field()]}, "title")

    def test_populated_legacy_paras(self):
        self.assert_populated_extraction({"paras": [field()]}, "title")

    def test_current_params_override_legacy_fields(self):
        self.assert_populated_extraction(
            {"params": [field("current")], "paras": [field("old")]}, "current")

    def test_existing_optimization_guards_remain_active(self):
        for overrides in ({"iframe": True}, {"skipCount": 1}):
            for loop_first in (True, False):
                with self.subTest(overrides=overrides, loop_first=loop_first):
                    loop, _ = self.preprocess({"params": [field()]}, 1,
                                              loop_first, overrides)
                    self.assertFalse(loop["quickExtractable"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
