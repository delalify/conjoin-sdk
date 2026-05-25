from __future__ import annotations

import os
from pathlib import Path

from conjoin_cloud import Conjoin, UploadProgress


def report_progress(progress: UploadProgress) -> None:
    print(f"{progress.loaded}/{progress.total} bytes")


def main() -> None:
    api_key = os.environ["CONJOIN_API_KEY"]
    container = os.environ["CONJOIN_STORAGE_CONTAINER"]
    upload_path = os.environ.get("CONJOIN_STORAGE_PATH", "examples/monthly.csv")
    local_path = Path(os.environ.get("CONJOIN_UPLOAD_FILE", "monthly.csv"))
    download_path = Path(os.environ.get("CONJOIN_DOWNLOAD_FILE", "monthly.downloaded.csv"))

    with Conjoin(api_key=api_key) as client:
        client.storage.upload(
            container=container,
            path=upload_path,
            content_type="text/csv",
            body=local_path,
            on_progress=report_progress,
        )

        with client.storage.download(container=container, path=upload_path) as download:
            download_path.write_bytes(download.read())


if __name__ == "__main__":
    main()
