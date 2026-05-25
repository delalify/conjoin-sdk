from __future__ import annotations

import os

from conjoin_cloud import Conjoin


def main() -> None:
    api_key = os.environ["CONJOIN_API_KEY"]
    model = os.environ["CONJOIN_AI_MODEL"]

    with Conjoin(api_key=api_key) as client:
        response = client.ai.chat.complete(
            model=model,
            messages=[{"role": "user", "content": "Write a concise status update."}],
        )
        print(response.choices[0].message.content)

        for chunk in client.ai.chat.stream(
            model=model,
            messages=[{"role": "user", "content": "Stream one sentence."}],
        ):
            for choice in chunk.choices:
                if choice.delta.content:
                    print(choice.delta.content, end="")


if __name__ == "__main__":
    main()
