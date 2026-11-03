"""Regressions for CLI MySQL config defaults (issues #939 and #483).

Run: python -X utf8 scripts/test_mysql_config.py
Uses ExecuteStage/requirements.txt. AST-load actual executor methods to avoid
module-level browser/OCR startup. The production MySQL client reads real JSON
fixtures; only its database connection and the browser/download monitor are
replaced. This does not require a running MySQL server.
"""

import ast
import contextlib
from datetime import datetime
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import threading
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch


EXECUTE_STAGE = Path(__file__).resolve().parents[1] / "ExecuteStage"
sys.path.insert(0, str(EXECUTE_STAGE))
import utils
from constants import DataWriteMode, GraphOption, WriteMode


class ConfigTestMySQL(utils.myMySQL):
    def __del__(self):
        # Connections are mocks; avoid the production destructor's console
        # output after a failed constructor or after stdout capture ends.
        pass


def load_browser_thread():
    path = EXECUTE_STAGE / "easyspider_executestage.py"
    tree = ast.parse(path.read_text(encoding="utf-8"))
    browser = next(node for node in tree.body
                   if isinstance(node, ast.ClassDef) and node.name == "BrowserThread")
    names = {"__init__", "preprocess", "readFromExcel", "print_and_log"}
    browser.body = [node for node in browser.body
                    if isinstance(node, ast.FunctionDef) and node.name in names]
    namespace = dict(vars(utils), datetime=datetime, io=io, os=os,
                     Thread=threading.Thread, DataWriteMode=DataWriteMode,
                     WriteMode=WriteMode, GraphOption=GraphOption,
                     threading=SimpleNamespace(Event=threading.Event, Thread=Mock),
                     WebDriverWait=lambda *args: None, driver_path="chromedriver",
                     myMySQL=ConfigTestMySQL)
    exec(compile(ast.Module(body=[browser], type_ignores=[]), str(path), "exec"),
         namespace)
    return namespace["BrowserThread"]


BrowserThread = load_browser_thread()


class MySQLConfigTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        previous = Path.cwd()
        os.chdir(directory.name)
        self.addCleanup(os.chdir, previous)
        Path("Data").mkdir()
        Path("stealth.min.js").write_text("", encoding="utf-8")
        self.default = {
            "host": "127.0.0.1", "port": 3307, "username": "default_user",
            "password": "fixture_password", "database": "default_database",
        }
        Path("mysql_config.json").write_text(json.dumps(self.default), encoding="utf-8")
        # Production path handling is platform-specific. Isolate the Windows/
        # Linux data-directory convention even when these tests run on macOS.
        platform_patch = patch.object(utils.sys, "platform", "linux")
        platform_patch.start()
        self.addCleanup(platform_patch.stop)
        connection_patch = patch.object(utils.pymysql, "connect")
        self.connect = connection_patch.start()
        self.addCleanup(connection_patch.stop)
        self.cursor = self.connect.return_value.cursor.return_value
        self.cursor.fetchone.return_value = ("reports",)

    def start(self, config, output_format="mysql", write_mode=DataWriteMode.Append.value,
              output=None):
        service = {
            "saveName": "reports", "graph": [], "links": "https://example.invalid/",
            "version": "0.6.5", "containJudge": False, "recordLog": False,
            "outputFormat": output_format, "dataWriteMode": write_mode,
            "outputParameters": [{"name": "value", "type": "text", "recordASField": 1}],
        }
        browser = Mock()
        browser.command_executor._commands = {}
        with contextlib.redirect_stdout(output if output is not None else io.StringIO()):
            return BrowserThread(browser, 1, service, "0.6.5", threading.Event(),
                                 "", config, {}, threading.Event())

    def assert_connection_config(self, expected):
        self.connect.assert_called_once_with(
            host=expected["host"], port=expected["port"], user=expected["username"],
            passwd=expected["password"], db=expected["database"])

    def test_legacy_config_without_mysql_path_reads_default_file(self):
        worker = self.start({"webserver_address": "http://localhost", "webserver_port": 8074})
        self.assertIsInstance(worker.mysql, utils.myMySQL)
        self.assertEqual(worker.writeMode, WriteMode.MySQL.value)
        self.assert_connection_config(self.default)
        self.cursor.execute.assert_called_once_with("SHOW TABLES LIKE 'reports'")

    def test_explicit_default_path_remains_supported(self):
        self.start({"mysql_config_path": "./mysql_config.json"})
        self.assert_connection_config(self.default)

    def test_missing_path_keeps_macos_application_support_location(self):
        default_file = str(Path("mysql_config.json").resolve())
        with patch.object(utils.sys, "platform", "darwin"), \
                patch.object(utils.os.path, "expanduser", return_value=default_file) as expand:
            self.start({})
        expand.assert_called_once_with(
            "~/Library/Application Support/EasySpider/mysql_config.json")
        self.assert_connection_config(self.default)

    def test_explicit_relative_path_takes_precedence_over_default(self):
        path = Path("custom settings") / "mysql.json"
        path.parent.mkdir()
        custom = {**self.default, "host": "custom.example.invalid", "database": "custom_db"}
        path.write_text(json.dumps(custom), encoding="utf-8")
        self.start({"mysql_config_path": str(path)})
        self.assert_connection_config(custom)

    def test_explicit_absolute_path_takes_precedence_over_default(self):
        path = Path("absolute_mysql.json").resolve()
        custom = {**self.default, "port": 3310, "username": "absolute_user"}
        path.write_text(json.dumps(custom), encoding="utf-8")
        self.start({"mysql_config_path": str(path)})
        self.assert_connection_config(custom)

    def test_default_path_preserves_overwrite_table_mode(self):
        self.start({}, write_mode=DataWriteMode.Cover.value)
        self.assert_connection_config(self.default)
        statements = [call.args[0] for call in self.cursor.execute.call_args_list]
        self.assertEqual(statements[:2], ["SHOW TABLES LIKE 'reports'", "DROP TABLE reports"])
        self.assertTrue(statements[2].startswith("CREATE TABLE reports "))

    def test_non_mysql_exports_do_not_need_a_mysql_path(self):
        for output_format in ("csv", "txt", "xlsx", "json"):
            with self.subTest(output_format=output_format):
                worker = self.start({}, output_format=output_format)
                self.assertFalse(hasattr(worker, "mysql"))
        self.connect.assert_not_called()

    def test_missing_default_file_keeps_configuration_diagnostics(self):
        Path("mysql_config.json").unlink()
        output = io.StringIO()
        with self.assertRaises(SystemExit):
            self.start({}, output=output)
        self.assertIn("mysql_config.json", output.getvalue())
        self.connect.assert_not_called()


if __name__ == "__main__":
    unittest.main(verbosity=2)
