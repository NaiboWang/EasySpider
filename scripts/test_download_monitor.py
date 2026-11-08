"""Run from the repository root: python scripts/test_download_monitor.py."""
from pathlib import Path
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "ExecuteStage"))
import utils


class DownloadMonitorTests(unittest.TestCase):
    def test_only_completed_new_files_are_renamed_once(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "existing.pdf").write_bytes(b"existing")
            stop = threading.Event()
            scans = 0

            def next_scan(_seconds):
                nonlocal scans
                scans += 1
                if scans == 1:
                    (root / "folder").mkdir()
                    for name in ("new.pdf", "esfile_saved.pdf", "part.crdownload",
                                 "page.htm", "page.html"):
                        (root / name).write_bytes(b"download")
                elif scans == 3:
                    stop.set()

            with patch.object(utils.time, "sleep", side_effect=next_scan):
                utils.rename_downloaded_file(directory, stop)

            names = {p.name for p in root.iterdir()}
            self.assertTrue((root / "folder").is_dir())
            self.assertTrue({"existing.pdf", "esfile_saved.pdf", "part.crdownload",
                             "page.htm", "page.html"}.issubset(names))
            renamed = list(root.glob("esfile_new.pdf_*_new.pdf"))
            self.assertEqual(len(renamed), 1)
            self.assertEqual(renamed[0].read_bytes(), b"download")
            self.assertEqual(len(names), 7)


if __name__ == "__main__":
    unittest.main(verbosity=2)
