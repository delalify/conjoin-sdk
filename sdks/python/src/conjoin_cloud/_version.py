from importlib.metadata import PackageNotFoundError, version

_DISTRIBUTION_NAME = "conjoin-cloud"
_UNKNOWN_VERSION = "0+unknown"


def _read_version() -> str:
    try:
        return version(_DISTRIBUTION_NAME)
    except PackageNotFoundError:
        return _UNKNOWN_VERSION


__version__ = _read_version()
