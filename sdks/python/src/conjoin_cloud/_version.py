from importlib.metadata import PackageNotFoundError, version

_DISTRIBUTION_NAME = "conjoin-cloud"
_FALLBACK_VERSION = "0.1.0"


def _read_version() -> str:
    try:
        return version(_DISTRIBUTION_NAME)
    except PackageNotFoundError:
        return _FALLBACK_VERSION


__version__ = _read_version()

