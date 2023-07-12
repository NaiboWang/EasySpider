#!/usr/bin/env python3
# this module is part of undetected_chromedriver

from distutils.version import LooseVersion
import io
import logging
import os
import pathlib
import random
import re
import shutil
import string
import subprocess
import sys
import time
from urllib.request import urlopen
from urllib.request import urlretrieve
import zipfile
from multiprocessing import Lock

logger = logging.getLogger(__name__)

IS_POSIX = sys.platform.startswith(("darwin", "cygwin", "linux", "linux2"))


class Patcher(object):
    lock = Lock()
    url_repo = "https://chromedriver.storage.googleapis.com"
    zip_name = "chromedriver_%s.zip"
    exe_name = "chromedriver%s"

    platform = sys.platform
    if platform.endswith("win32"):
        zip_name %= "win32"
        exe_name %= ".exe"
    if platform.endswith(("linux", "linux2")):
        zip_name %= "linux64"
        exe_name %= ""
    if platform.endswith("darwin"):
        zip_name %= "mac64"
        exe_name %= ""

    if platform.endswith("win32"):
        d = "~/appdata/roaming/undetected_chromedriver"
    elif "LAMBDA_TASK_ROOT" in os.environ:
        d = "/tmp/undetected_chromedriver"
    elif platform.startswith(("linux", "linux2")):
        d = "~/.local/share/undetected_chromedriver"
    elif platform.endswith("darwin"):
        d = "~/Library/Application Support/undetected_chromedriver"
    else:
        d = "~/.undetected_chromedriver"
    data_path = os.path.abspath(os.path.expanduser(d))

    def __init__(
        self,
        executable_path=None,
        force=False,
        version_main: int = 0,
        user_multi_procs=False,
    ):
        """
        Args:
            executable_path: None = automatic
                             a full file path to the chromedriver executable
            force: False
                    terminate processes which are holding lock
            version_main: 0 = auto
                specify main chrome version (rounded, ex: 82)
        """
        self.force = force
        self._custom_exe_path = False
        prefix = "undetected"
        self.user_multi_procs = user_multi_procs

        if not os.path.exists(self.data_path):
            os.makedirs(self.data_path, exist_ok=True)

        if not executable_path:
            self.executable_path = os.path.join(
                self.data_path, "_".join([prefix, self.exe_name])
            )

        if not IS_POSIX:
            if executable_path:
                if not executable_path[-4:] == ".exe":
                    executable_path += ".exe"

        self.zip_path = os.path.join(self.data_path, prefix)

        if not executable_path:
            if not self.user_multi_procs:
                self.executable_path = os.path.abspath(
                    os.path.join(".", self.executable_path)
                )

        if executable_path:
            self._custom_exe_path = True
            self.executable_path = executable_path

        self.version_main = version_main
        self.version_full = None

    def auto(self, executable_path=None, force=False, version_main=None, _=None):
        """

        Args:
            executable_path:
            force:
            version_main:

        Returns:

        """
        # if self.user_multi_procs and \
        #         self.user_multi_procs != -1:
        #     # -1 being a skip value used later in this block
        #
        p = pathlib.Path(self.data_path)
        # with Lock():
        #     files = list(p.rglob("*chromedriver*?"))
        #     for file in files:
        #         if self.is_binary_patched(file):
        #             self.executable_path = str(file)
        #             return True

        if executable_path:
            self.executable_path = executable_path
            self._custom_exe_path = True

        if self._custom_exe_path:
            file_name, file_extension = os.path.splitext(self.executable_path)
            # 创建新的文件名
            new_file = f"{file_name}_uc{file_extension}"
            if not os.path.exists(new_file):
                shutil.copy(self.executable_path, new_file)
            self.executable_path = new_file # 用新的chromedriver
            print(f"New chromedriver path: {self.executable_path}")
            ispatched = self.is_binary_patched(self.executable_path)
            folder_path = os.path.dirname(os.path.abspath(self.executable_path))
            folder_list = [f for f in os.listdir(folder_path) if os.path.isdir(os.path.join(folder_path, f))]
            numeric_folders = [f for f in folder_list if f[0].isdigit()]
            version = numeric_folders[0].split('.')[0]
            # print(f"\n\n\nCloudflare下需要自行安装浏览器，请确保自己的机器环境已经安装了 {numeric_folders[0].split('.')[0]} 版本的Chrome浏览器（不是软件自带的Chrome浏览器，需要自己安装浏览器且版本号一定要正确），否则程序无法运行！")
            # print("Please make sure that your machine environment has installed the Chrome browser version %s (not the Chrome browser provided by the software, you need to install the browser yourself and the version number must be correct), otherwise the program cannot run!" % numeric_folders[0].split('.')[0])
            
            if not ispatched:
                print("Patching chromedriver...")
                return version
            else:
                print("No need to patch chromedriver.")
                return version

        if version_main:
            self.version_main = version_main
        if force is True:
            self.force = force

        try:
            os.unlink(self.executable_path)
        except PermissionError:
            if self.force:
                self.force_kill_instances(self.executable_path)
                return self.auto(force=not self.force)
            try:
                if self.is_binary_patched():
                    # assumes already running AND patched
                    return True
            except PermissionError:
                pass
            # return False
        except FileNotFoundError:
            pass

        release = self.fetch_release_number()
        self.version_main = release.version[0]
        self.version_full = release
        self.unzip_package(self.fetch_package())
        return self.patch()

    def driver_binary_in_use(self, path: str = None) -> bool:
        """
        naive test to check if a found chromedriver binary is
        currently in use

        Args:
            path: a string or PathLike object to the binary to check.
                  if not specified, we check use this object's executable_path
        """
        if not path:
            path = self.executable_path
        p = pathlib.Path(path)

        if not p.exists():
            raise OSError("file does not exist: %s" % p)
        try:
            with open(p, mode="a+b") as fs:
                exc = []
                try:

                    fs.seek(0, 0)
                except PermissionError as e:
                    exc.append(e)  # since some systems apprently allow seeking
                    # we conduct another test
                try:
                    fs.readline()
                except PermissionError as e:
                    exc.append(e)

                if exc:

                    return True
                return False
            # ok safe to assume this is in use
        except Exception as e:
            # logger.exception("whoops ", e)
            pass

    def cleanup_unused_files(self):
        p = pathlib.Path(self.data_path)
        items = list(p.glob("*undetected*"))
        print(items)

    def patch(self):
        self.patch_exe()
        return self.is_binary_patched()

    def fetch_release_number(self):
        """
        Gets the latest major version available, or the latest major version of self.target_version if set explicitly.
        :return: version string
        :rtype: LooseVersion
        """
        path = "/latest_release"
        if self.version_main:
            path += f"_{self.version_main}"
        path = path.upper()
        logger.debug("getting release number from %s" % path)
        return LooseVersion(urlopen(self.url_repo + path).read().decode())

    def parse_exe_version(self):
        with io.open(self.executable_path, "rb") as f:
            for line in iter(lambda: f.readline(), b""):
                match = re.search(rb"platform_handle\x00content\x00([0-9.]*)", line)
                if match:
                    return LooseVersion(match[1].decode())

    def fetch_package(self):
        """
        Downloads ChromeDriver from source

        :return: path to downloaded file
        """
        u = "%s/%s/%s" % (self.url_repo, self.version_full.vstring, self.zip_name)
        logger.debug("downloading from %s" % u)
        # return urlretrieve(u, filename=self.data_path)[0]
        return urlretrieve(u)[0]

    def unzip_package(self, fp):
        """
        Does what it says

        :return: path to unpacked executable
        """
        logger.debug("unzipping %s" % fp)
        try:
            os.unlink(self.zip_path)
        except (FileNotFoundError, OSError):
            pass

        os.makedirs(self.zip_path, mode=0o755, exist_ok=True)
        with zipfile.ZipFile(fp, mode="r") as zf:
            zf.extract(self.exe_name, self.zip_path)
        os.rename(os.path.join(self.zip_path, self.exe_name), self.executable_path)
        os.remove(fp)
        os.rmdir(self.zip_path)
        os.chmod(self.executable_path, 0o755)
        return self.executable_path

    @staticmethod
    def force_kill_instances(exe_name):
        """
        kills running instances.
        :param: executable name to kill, may be a path as well

        :return: True on success else False
        """
        exe_name = os.path.basename(exe_name)
        if IS_POSIX:
            r = os.system("kill -f -9 $(pidof %s)" % exe_name)
        else:
            r = os.system("taskkill /f /im %s" % exe_name)
        return not r

    @staticmethod
    def gen_random_cdc():
        cdc = random.choices(string.ascii_letters, k=27)
        return "".join(cdc).encode()

    def is_binary_patched(self, executable_path=None):
        executable_path = executable_path or self.executable_path
        try:
            with io.open(executable_path, "rb") as fh:
                return fh.read().find(b"undetected chromedriver") != -1
        except FileNotFoundError:
            return False

    def patch_exe(self):
        start = time.perf_counter()
        print("patching driver executable %s" % self.executable_path)
        with io.open(self.executable_path, "r+b") as fh:
            content = fh.read()
            # match_injected_codeblock = re.search(rb"{window.*;}", content)
            match_injected_codeblock = re.search(rb"\{window\.cdc.*?;\}", content)
            if match_injected_codeblock:
                target_bytes = match_injected_codeblock[0]
                new_target_bytes = (
                    b'{console.log("undetected chromedriver 1337!")}'.ljust(
                        len(target_bytes), b" "
                    )
                )
                new_content = content.replace(target_bytes, new_target_bytes)
                if new_content == content:
                    logger.warning(
                        "something went wrong patching the driver binary. could not find injection code block"
                    )
                else:
                    logger.debug(
                        "found block:\n%s\nreplacing with:\n%s"
                        % (target_bytes, new_target_bytes)
                    )
                fh.seek(0)
                fh.write(new_content)
        logger.debug(
            "patching took us {:.2f} seconds".format(time.perf_counter() - start)
        )

    def __repr__(self):
        return "{0:s}({1:s})".format(
            self.__class__.__name__,
            self.executable_path,
        )

    def __del__(self):
        if self._custom_exe_path:
            # if the driver binary is specified by user
            # we assume it is important enough to not delete it
            return
        else:
            timeout = 3  # stop trying after this many seconds
            t = time.monotonic()
            now = lambda: time.monotonic()
            while now() - t > timeout:
                # we don't want to wait until the end of time
                try:
                    if self.user_multi_procs:
                        break
                    os.unlink(self.executable_path)
                    logger.debug("successfully unlinked %s" % self.executable_path)
                    break
                except (OSError, RuntimeError, PermissionError):
                    time.sleep(0.01)
                    continue
                except FileNotFoundError:
                    break
