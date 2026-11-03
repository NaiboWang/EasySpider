"""Regressions for daily export names (issue #945).

Run: python -X utf8 scripts/test_output_names.py
Uses the executor dependencies in ExecuteStage/requirements.txt. Load actual
BrowserThread methods through AST to avoid module-level browser/OCR startup.
Only browser commands, the download monitor and MySQL are replaced; export
files, append/overwrite/rename modes and directory creation use real code.
"""

import ast
import contextlib
import csv
from datetime import datetime
import io
import os
from pathlib import Path
import sys
import tempfile
import threading
from types import SimpleNamespace
import unittest
from unittest.mock import Mock


EXECUTE_STAGE = Path(__file__).resolve().parents[1] / "ExecuteStage"
sys.path.insert(0, str(EXECUTE_STAGE))
import utils
from constants import DataWriteMode, GraphOption, WriteMode


class Clock:
    moment = datetime(2026, 11, 3, 14, 5, 6)
    following = None

    @classmethod
    def now(cls):
        moment = cls.moment
        if cls.following is not None:
            cls.moment = cls.following
        return moment


def load_browser_thread():
    path = EXECUTE_STAGE / "easyspider_executestage.py"
    tree = ast.parse(path.read_text(encoding="utf-8"))
    browser = next(node for node in tree.body
                   if isinstance(node, ast.ClassDef) and node.name == "BrowserThread")
    names = {"__init__", "preprocess", "readFromExcel", "print_and_log", "saveData"}
    browser.body = [node for node in browser.body
                    if isinstance(node, ast.FunctionDef) and node.name in names]
    namespace = dict(vars(utils), datetime=Clock, io=io, os=os,
                     Thread=threading.Thread, DataWriteMode=DataWriteMode,
                     WriteMode=WriteMode, GraphOption=GraphOption,
                     threading=SimpleNamespace(Event=threading.Event, Thread=Mock),
                     WebDriverWait=lambda *args: None,
                     driver_path="chromedriver", myMySQL=Mock())
    exec(compile(ast.Module(body=[browser], type_ignores=[]), str(path), "exec"),
         namespace)
    return namespace["BrowserThread"], namespace["myMySQL"]


BrowserThread, MYSQL = load_browser_thread()


class OutputNameTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        previous = Path.cwd()
        os.chdir(directory.name)
        self.addCleanup(os.chdir, previous)
        Path("Data").mkdir()
        Path("stealth.min.js").write_text("", encoding="utf-8")
        MYSQL.reset_mock()
        self.output = Path("Data/Task_1")

    def start(self, name="reports_current_date", cli_name="", when=None,
              following=None, output_format="csv", **settings):
        Clock.moment = when or datetime(2026, 11, 3, 14, 5, 6)
        Clock.following = following
        service = {
            "saveName": name, "graph": [], "links": "https://example.invalid/",
            "version": "0.6.5", "containJudge": False, "recordLog": False,
            "outputFormat": output_format,
            "outputParameters": [{"name": "value", "type": "text", "recordASField": 1}],
            **settings,
        }
        if name is None:
            del service["saveName"]
        browser = Mock()
        browser.command_executor._commands = {}
        with contextlib.redirect_stdout(io.StringIO()):
            return BrowserThread(browser, 1, service, "0.6.5", threading.Event(),
                                 cli_name, {"mysql_config_path": "./mysql_config.json"},
                                 {}, threading.Event())

    def save_row(self, worker, value):
        worker.OUTPUT.append([value])
        with contextlib.redirect_stdout(io.StringIO()):
            worker.saveData(exit=True)

    def rows(self, name):
        with (self.output / name).open(encoding="utf-8-sig", newline="") as handle:
            return list(csv.reader(handle))

    def test_date_token_in_task_name_and_download_directory(self):
        worker = self.start()
        self.assertEqual(worker.saveName, "reports_2026_11_03")
        self.assertEqual(Path(worker.downloadFolder), self.output / "reports_2026_11_03")
        self.assertTrue((Path(worker.downloadFolder) / "files").is_dir())

    def test_timestamp_default_and_literal_names_remain_compatible(self):
        for name, expected in ((None, "2026_11_03_14_05_06"),
                               ("run_current_time", "run_2026_11_03_14_05_06"),
                               ("report", "report")):
            with self.subTest(name=name):
                self.assertEqual(self.start(name).saveName, expected)

    def test_cli_override_expands_both_tokens_and_takes_precedence(self):
        worker = self.start("ignored_current_date", "cli_current_date_current_time")
        self.assertEqual(worker.saveName, "cli_2026_11_03_2026_11_03_14_05_06")

    def test_repeated_and_mixed_tokens_expand_every_occurrence(self):
        worker = self.start("current_date_current_time_current_date_current_time")
        self.assertEqual(worker.saveName,
                         "2026_11_03_2026_11_03_14_05_06_2026_11_03_2026_11_03_14_05_06")

    def test_tokens_share_the_task_start_instant_across_midnight(self):
        worker = self.start("current_date_current_time",
                            when=datetime(2026, 11, 3, 23, 59, 59),
                            following=datetime(2026, 11, 4, 0, 0, 0))
        self.assertEqual(worker.saveName, "2026_11_03_2026_11_03_23_59_59")

    def test_same_day_appends_once_and_next_day_uses_another_file(self):
        first = self.start()
        self.save_row(first, "first")
        second = self.start(when=datetime(2026, 11, 3, 18, 0, 0))
        self.save_row(second, "second")
        third = self.start(when=datetime(2026, 11, 4, 1, 0, 0))
        self.save_row(third, "third")
        self.assertEqual(self.rows("reports_2026_11_03.csv"),
                         [["value"], ["first"], ["second"]])
        self.assertEqual(self.rows("reports_2026_11_04.csv"), [["value"], ["third"]])

    def test_later_saves_keep_the_initial_date(self):
        worker = self.start()
        self.save_row(worker, "before midnight")
        Clock.moment = datetime(2026, 11, 4, 0, 0, 0)
        self.save_row(worker, "after midnight")
        self.assertEqual(self.rows("reports_2026_11_03.csv"),
                         [["value"], ["before midnight"], ["after midnight"]])
        self.assertFalse((self.output / "reports_2026_11_04.csv").exists())

    def test_overwrite_and_rename_use_the_expanded_name(self):
        self.save_row(self.start(), "old")
        overwrite = self.start(dataWriteMode=DataWriteMode.Cover.value)
        self.save_row(overwrite, "replacement")
        renamed = self.start(dataWriteMode=DataWriteMode.Rename.value)
        self.save_row(renamed, "renamed")
        self.assertEqual(renamed.saveName, "reports_2026_11_03_2")
        self.assertEqual(self.rows("reports_2026_11_03.csv"), [["value"], ["replacement"]])
        self.assertEqual(self.rows("reports_2026_11_03_2.csv"), [["value"], ["renamed"]])

    def test_mysql_table_receives_the_expanded_name(self):
        worker = self.start(output_format="mysql")
        MYSQL.return_value.create_table.assert_called_once_with(
            "reports_2026_11_03", worker.service["outputParameters"], remove_if_exists=False)


if __name__ == "__main__":
    unittest.main(verbosity=2)
