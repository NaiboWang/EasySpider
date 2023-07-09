import atexit
import logging
import multiprocessing
import os
import platform
import signal
from subprocess import PIPE
from subprocess import Popen
import sys


CREATE_NEW_PROCESS_GROUP = 0x00000200
DETACHED_PROCESS = 0x00000008

REGISTERED = []


def start_detached(executable, *args):
    """
    Starts a fully independent subprocess (with no parent)
    :param executable: executable
    :param args: arguments to the executable, eg: ['--param1_key=param1_val', '-vvv' ...]
    :return: pid of the grandchild process
    """

    # create pipe
    reader, writer = multiprocessing.Pipe(False)

    # do not keep reference
    multiprocessing.Process(
        target=_start_detached,
        args=(executable, *args),
        kwargs={"writer": writer},
        daemon=True,
    ).start()
    # receive pid from pipe
    pid = reader.recv()
    REGISTERED.append(pid)
    # close pipes
    writer.close()
    reader.close()

    return pid


def _start_detached(executable, *args, writer: multiprocessing.Pipe = None):
    # configure launch
    kwargs = {}
    if platform.system() == "Windows":
        kwargs.update(creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP)
    elif sys.version_info < (3, 2):
        # assume posix
        kwargs.update(preexec_fn=os.setsid)
    else:  # Python 3.2+ and Unix
        kwargs.update(start_new_session=True)

    # run
    p = Popen([executable, *args], stdin=PIPE, stdout=PIPE, stderr=PIPE, **kwargs)

    # send pid to pipe
    writer.send(p.pid)
    sys.exit()


def _cleanup():
    for pid in REGISTERED:
        try:
            logging.getLogger(__name__).debug("cleaning up pid %d " % pid)
            os.kill(pid, signal.SIGTERM)
        except:  # noqa
            pass


atexit.register(_cleanup)
