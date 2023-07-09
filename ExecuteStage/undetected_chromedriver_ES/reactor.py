#!/usr/bin/env python3
# this module is part of undetected_chromedriver

import asyncio
import json
import logging
import threading


logger = logging.getLogger(__name__)


class Reactor(threading.Thread):
    def __init__(self, driver: "Chrome"):
        super().__init__()

        self.driver = driver
        self.loop = asyncio.new_event_loop()

        self.lock = threading.Lock()
        self.event = threading.Event()
        self.daemon = True
        self.handlers = {}

    def add_event_handler(self, method_name, callback: callable):
        """

        Parameters
        ----------
        event_name: str
            example "Network.responseReceived"

        callback: callable
            callable which accepts 1 parameter: the message object dictionary

        Returns
        -------

        """
        with self.lock:
            self.handlers[method_name.lower()] = callback

    @property
    def running(self):
        return not self.event.is_set()

    def run(self):
        try:
            asyncio.set_event_loop(self.loop)
            self.loop.run_until_complete(self.listen())
        except Exception as e:
            logger.warning("Reactor.run() => %s", e)

    async def _wait_service_started(self):
        while True:
            with self.lock:
                if (
                    getattr(self.driver, "service", None)
                    and getattr(self.driver.service, "process", None)
                    and self.driver.service.process.poll()
                ):
                    await asyncio.sleep(self.driver._delay or 0.25)
                else:
                    break

    async def listen(self):
        while self.running:
            await self._wait_service_started()
            await asyncio.sleep(1)

            try:
                with self.lock:
                    log_entries = self.driver.get_log("performance")

                for entry in log_entries:
                    try:
                        obj_serialized: str = entry.get("message")
                        obj = json.loads(obj_serialized)
                        message = obj.get("message")
                        method = message.get("method")

                        if "*" in self.handlers:
                            await self.loop.run_in_executor(
                                None, self.handlers["*"], message
                            )
                        elif method.lower() in self.handlers:
                            await self.loop.run_in_executor(
                                None, self.handlers[method.lower()], message
                            )

                        # print(type(message), message)
                    except Exception as e:
                        raise e from None

            except Exception as e:
                if "invalid session id" in str(e):
                    pass
                else:
                    logging.debug("exception ignored :", e)
