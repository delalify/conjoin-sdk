from __future__ import annotations

import os

from conjoin_cloud import Conjoin


def main() -> None:
    api_key = os.environ["CONJOIN_API_KEY"]

    with Conjoin(api_key=api_key) as client:
        page = client.auth.accounts.list(query={"limit": 10})

        for account in page.data:
            print(account.account_id)


if __name__ == "__main__":
    main()
