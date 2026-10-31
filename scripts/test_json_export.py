"""Regression tests for #1007; isolate the exporter from browser dependencies."""
import ast
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SOURCE = Path(__file__).resolve().parents[1] / 'ExecuteStage' / 'utils.py'
tree = ast.parse(SOURCE.read_text(encoding='utf-8'))
function = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'write_to_json')
namespace = dict(json=json, os=os, tempfile=tempfile)
exec(compile(ast.Module(body=[function], type_ignores=[]), str(SOURCE), 'exec'), namespace)
write_to_json = namespace['write_to_json']


class JsonExportTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / 'output.json'

    def export(self, value='中文'):
        write_to_json(str(self.path), [[value]], ['text'], [True], ['value'])

    def assert_preserved(self, original):
        self.assertEqual(self.path.read_bytes(), original)
        self.assertEqual(list(self.path.parent.iterdir()), [self.path])

    def test_create_and_append(self):
        self.export()
        self.export('second')
        self.assertEqual(json.loads(self.path.read_text()), [{'value': '中文'}, {'value': 'second'}])

    def test_invalid_existing_files(self):
        for content, error in [(b'{broken', json.JSONDecodeError), (b'\xff', UnicodeDecodeError), (b'', json.JSONDecodeError), (b'{}', ValueError), (b'null', ValueError)]:
            with self.subTest(content=content):
                self.path.write_bytes(content)
                with self.assertRaises(error):
                    self.export()
                self.assert_preserved(content)

    def test_read_permission_error(self):
        original = b'[{"old": 1}]'
        self.path.write_bytes(original)
        with patch('builtins.open', side_effect=PermissionError('denied')):
            with self.assertRaises(PermissionError):
                self.export()
        self.assert_preserved(original)

    def test_serialization_failure(self):
        original = b'[{"old": 1}]'
        self.path.write_bytes(original)
        with self.assertRaises(TypeError):
            self.export(object())
        self.assert_preserved(original)

    def test_replace_failure(self):
        original = b'[{"old": 1}]'
        self.path.write_bytes(original)
        with patch.object(os, 'replace', side_effect=PermissionError('denied')):
            with self.assertRaises(PermissionError):
                self.export()
        self.assert_preserved(original)


if __name__ == '__main__':
    unittest.main()
