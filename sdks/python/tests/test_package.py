from importlib.metadata import PackageNotFoundError, version

import conjoin_cloud
from conjoin_cloud import DEFAULT_API_VERSION, __version__


def test_version_matches_project_metadata() -> None:
    try:
        expected_version = version("conjoin-cloud")
    except PackageNotFoundError:
        expected_version = "0.1.0"

    assert __version__ == expected_version


def test_default_api_version_is_current() -> None:
    assert DEFAULT_API_VERSION == "2026-06-01"


def test_phase_two_public_surface_is_metadata_only() -> None:
    assert conjoin_cloud.__all__ == ("DEFAULT_API_VERSION", "__version__")
    assert not hasattr(conjoin_cloud, "Conjoin")
    assert not hasattr(conjoin_cloud, "AsyncConjoin")
