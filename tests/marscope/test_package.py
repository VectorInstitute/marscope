"""Tests for the package itself."""

import marscope


def test_version_is_set() -> None:
    """The installed package exposes its version."""
    assert marscope.__version__
