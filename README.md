# MARScope

----------------------------------------------------------------------------------------

[![code checks](https://github.com/VectorInstitute/marscope/actions/workflows/code_checks.yml/badge.svg)](https://github.com/VectorInstitute/marscope/actions/workflows/code_checks.yml)
[![unit tests](https://github.com/VectorInstitute/marscope/actions/workflows/unit_tests.yml/badge.svg)](https://github.com/VectorInstitute/marscope/actions/workflows/unit_tests.yml)
[![docs](https://github.com/VectorInstitute/marscope/actions/workflows/docs.yml/badge.svg)](https://github.com/VectorInstitute/marscope/actions/workflows/docs.yml)
[![codecov](https://codecov.io/github/VectorInstitute/marscope/graph/badge.svg?token=83MYFZ3UPA)](https://codecov.io/github/VectorInstitute/marscope)
![GitHub License](https://img.shields.io/github/license/VectorInstitute/marscope)

See what a video deepfake detector sees. MARScope runs trained detectors on a video, shows the
evidence behind each score, and explains why one score is not proof. Educational use only.

> **Status: early development.** Nothing is released yet.

## Developing

Set up the environment with [uv](https://docs.astral.sh/uv/getting-started/installation/):

```bash
uv sync                    # runtime, dev and docs groups
source .venv/bin/activate
pre-commit install
```

Checks run before every PR (see [CONTRIBUTING.md](CONTRIBUTING.md)):

```bash
uv run pre-commit run --all-files            # ruff, mypy, typos, doctest, unit tests
uv run pytest -m "not integration_test" tests
```

Docs: `uv run mkdocs serve`.

## License

[Apache 2.0](LICENSE.md).
