"""
Who may change the galaxy layout. Only blog/galaxy.py opens `layout_writes()`; the model guards check `is_writing()`.
Its own module so models.py and galaxy.py can both import it without importing each other.
"""
from contextlib import contextmanager
from contextvars import ContextVar

_writing = ContextVar('galaxy_writing', default=False)


class LayoutLocked(Exception):
    """A layout write from outside blog/galaxy.py."""


def is_writing():
    return _writing.get()


@contextmanager
def layout_writes():
    token = _writing.set(True)
    try:
        yield
    finally:
        _writing.reset(token)


def require(what, use='the galaxy service'):
    if not is_writing():
        raise LayoutLocked(f'{what} is managed by the galaxy layout; use {use} (blog/galaxy.py)')
