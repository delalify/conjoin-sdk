from __future__ import annotations

import asyncio
import os

from conjoin_cloud import AsyncConjoin


async def main() -> None:
    api_key = os.environ["CONJOIN_API_KEY"]

    async with AsyncConjoin(api_key=api_key) as client:
        page = await client.auth.accounts.list(query={"limit": 10})

        for account in page.data:
            print(account.account_id)


if __name__ == "__main__":
    asyncio.run(main())
