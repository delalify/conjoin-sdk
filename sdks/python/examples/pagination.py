from __future__ import annotations

import os

from conjoin_cloud import Conjoin
from conjoin_cloud.generated._models import AuthAccountListQuery


def main() -> None:
    api_key = os.environ["CONJOIN_API_KEY"]

    with Conjoin(api_key=api_key) as client:
        query: AuthAccountListQuery = {"limit": 100}

        while True:
            page = client.auth.accounts.list(query=query)

            for account in page.data:
                print(account.account_id)

            if page.cursor is None or page.cursor.next is None:
                break

            query = {"limit": 100, "cursor": {"next": page.cursor.next}}


if __name__ == "__main__":
    main()
