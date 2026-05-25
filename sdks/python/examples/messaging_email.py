from __future__ import annotations

import os

from conjoin_cloud import Conjoin


def main() -> None:
    api_key = os.environ["CONJOIN_API_KEY"]
    profile_id = os.environ["CONJOIN_MESSAGING_PROFILE_ID"]
    sender = os.environ["CONJOIN_EMAIL_FROM"]
    recipient = os.environ["CONJOIN_EMAIL_TO"]

    with Conjoin(api_key=api_key) as client:
        message = client.messaging.with_profile(profile_id).emails.send(
            data={
                "from_": sender,
                "to": [recipient],
                "subject": "Hello from Conjoin",
                "text": "This message was sent with the Conjoin Python SDK.",
            },
        )
        print(message.message_id)


if __name__ == "__main__":
    main()
