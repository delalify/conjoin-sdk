from importlib.metadata import PackageNotFoundError, version

import conjoin_cloud
from conjoin_cloud import DEFAULT_API_VERSION, AsyncConjoin, Conjoin, __version__


def test_version_matches_project_metadata() -> None:
    try:
        expected_version = version("conjoin-cloud")
    except PackageNotFoundError:
        expected_version = "0.1.0"

    assert __version__ == expected_version


def test_default_api_version_is_current() -> None:
    assert DEFAULT_API_VERSION == "2026-06-01"


def test_phase_three_public_clients_are_exposed() -> None:
    assert "Conjoin" in conjoin_cloud.__all__
    assert "AsyncConjoin" in conjoin_cloud.__all__
    assert Conjoin.__name__ == "Conjoin"
    assert AsyncConjoin.__name__ == "AsyncConjoin"
