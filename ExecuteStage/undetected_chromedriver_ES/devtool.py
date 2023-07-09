import asyncio
from collections.abc import Mapping
from collections.abc import Sequence
from functools import wraps
import logging
import threading
import time
import traceback
from typing import Any
from typing import Awaitable
from typing import Callable
from typing import List
from typing import Optional


class Structure(dict):
    """
    This is a dict-like object structure, which you should subclass
    Only properties defined in the class context are used on initialization.

    See example
    """

    _store = {}

    def __init__(self, *a, **kw):
        """
        Instantiate a new instance.

        :param a:
        :param kw:
        """

        super().__init__()

        # auxiliar dict
        d = dict(*a, **kw)
        for k, v in d.items():
            if isinstance(v, Mapping):
                self[k] = self.__class__(v)
            elif isinstance(v, Sequence) and not isinstance(v, (str, bytes)):
                self[k] = [self.__class__(i) for i in v]
            else:
                self[k] = v
        super().__setattr__("__dict__", self)

    def __getattr__(self, item):
        return getattr(super(), item)

    def __getitem__(self, item):
        return super().__getitem__(item)

    def __setattr__(self, key, value):
        self.__setitem__(key, value)

    def __setitem__(self, key, value):
        super().__setitem__(key, value)

    def update(self, *a, **kw):
        super().update(*a, **kw)

    def __eq__(self, other):
        return frozenset(other.items()) == frozenset(self.items())

    def __hash__(self):
        return hash(frozenset(self.items()))

    @classmethod
    def __init_subclass__(cls, **kwargs):
        cls._store = {}

    def _normalize_strings(self):
        for k, v in self.copy().items():
            if isinstance(v, (str)):
                self[k] = v.strip()


def timeout(seconds=3, on_timeout: Optional[Callable[[callable], Any]] = None):
    def wrapper(func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            def function_reached_timeout():
                if on_timeout:
                    on_timeout(func)
                else:
                    raise TimeoutError("function call timed out")

            t = threading.Timer(interval=seconds, function=function_reached_timeout)
            t.start()
            try:
                return func(*args, **kwargs)
            except:
                t.cancel()
                raise
            finally:
                t.cancel()

        return wrapped

    return wrapper


def test():
    import sys, os

    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    import undetected_chromedriver as uc
    import threading

    def collector(
        driver: uc.Chrome,
        stop_event: threading.Event,
        on_event_coro: Optional[Callable[[List[str]], Awaitable[Any]]] = None,
        listen_events: Sequence = ("browser", "network", "performance"),
    ):
        def threaded(driver, stop_event, on_event_coro):
            async def _ensure_service_started():
                while (
                    getattr(driver, "service", False)
                    and getattr(driver.service, "process", False)
                    and driver.service.process.poll()
                ):
                    print("waiting for driver service to come back on")
                    await asyncio.sleep(0.05)
                    # await asyncio.sleep(driver._delay or .25)

            async def get_log_lines(typ):
                await _ensure_service_started()
                return driver.get_log(typ)

            async def looper():
                while not stop_event.is_set():
                    log_lines = []
                    try:
                        for _ in listen_events:
                            try:
                                log_lines += await get_log_lines(_)
                            except:
                                if logging.getLogger().getEffectiveLevel() <= 10:
                                    traceback.print_exc()
                                continue
                        if log_lines and on_event_coro:
                            await on_event_coro(log_lines)
                    except Exception as e:
                        if logging.getLogger().getEffectiveLevel() <= 10:
                            traceback.print_exc()

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(looper())

        t = threading.Thread(target=threaded, args=(driver, stop_event, on_event_coro))
        t.start()

    async def on_event(data):
        print("on_event")
        print("data:", data)

    def func_called(fn):
        def wrapped(*args, **kwargs):
            print(
                "func called! %s  (args: %s, kwargs: %s)" % (fn.__name__, args, kwargs)
            )
            while driver.service.process and driver.service.process.poll() is not None:
                time.sleep(0.1)
            res = fn(*args, **kwargs)
            print("func completed! (result: %s)" % res)
            return res

        return wrapped

    logging.basicConfig(level=10)

    options = uc.ChromeOptions()
    options.set_capability(
        "goog:loggingPrefs", {"performance": "ALL", "browser": "ALL", "network": "ALL"}
    )

    driver = uc.Chrome(version_main=96, options=options)

    # driver.command_executor._request = timeout(seconds=1)(driver.command_executor._request)
    driver.command_executor._request = func_called(driver.command_executor._request)
    collector_stop = threading.Event()
    collector(driver, collector_stop, on_event)

    driver.get("https://nowsecure.nl")

    time.sleep(10)

    driver.quit()
