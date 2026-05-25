from __future__ import annotations

import keyword
import re

RESERVED_PYTHON_NAMES = {
    "copy",
    "dict",
    "json",
    "model_computed_fields",
    "model_config",
    "model_construct",
    "model_copy",
    "model_dump",
    "model_dump_json",
    "model_extra",
    "model_fields",
    "model_fields_set",
    "model_json_schema",
    "model_parametrized_name",
    "model_post_init",
    "model_rebuild",
    "model_validate",
    "model_validate_json",
    "model_validate_strings",
    "parse_file",
    "parse_obj",
    "parse_raw",
    "schema",
    "schema_json",
    "update_forward_refs",
    "validate",
}

UNCOUNTABLE = {
    "adulthood",
    "advice",
    "agenda",
    "aid",
    "aircraft",
    "alcohol",
    "analytics",
    "anime",
    "athletics",
    "cash",
    "commerce",
    "debris",
    "equipment",
    "firmware",
    "hardware",
    "headquarters",
    "information",
    "mail",
    "media",
    "music",
    "news",
    "only",
    "personnel",
    "police",
    "research",
    "series",
    "software",
    "staff",
    "traffic",
    "transportation",
    "wealth",
    "welfare",
    "you",
}

UNCOUNTABLE_RULES = [
    re.compile(r"[^aeiou]ese$", re.IGNORECASE),
    re.compile(r"deer$", re.IGNORECASE),
    re.compile(r"fish$", re.IGNORECASE),
    re.compile(r"measles$", re.IGNORECASE),
    re.compile(r"o[iu]s$", re.IGNORECASE),
    re.compile(r"pox$", re.IGNORECASE),
    re.compile(r"sheep$", re.IGNORECASE),
]

IRREGULARS = {
    "child": "children",
    "die": "dice",
    "echo": "echoes",
    "foot": "feet",
    "genus": "genera",
    "goose": "geese",
    "human": "humans",
    "man": "men",
    "ox": "oxen",
    "person": "people",
    "quiz": "quizzes",
    "tooth": "teeth",
    "woman": "women",
}

PLURAL_RULES = [
    (re.compile(r"m[ae]n$", re.IGNORECASE), "men"),
    (re.compile(r"eaux$", re.IGNORECASE), r"\g<0>"),
    (re.compile(r"(child)(?:ren)?$", re.IGNORECASE), r"\1ren"),
    (re.compile(r"(pe)(?:rson|ople)$", re.IGNORECASE), r"\1ople"),
    (re.compile(r"\b((?:tit)?m|l)(?:ice|ouse)$", re.IGNORECASE), r"\1ice"),
    (re.compile(r"(matr|cod|mur|sil|vert|ind|append)(?:ix|ex)$", re.IGNORECASE), r"\1ices"),
    (re.compile(r"(x|ch|ss|sh|zz)$", re.IGNORECASE), r"\1es"),
    (re.compile(r"([^ch][ieo][ln])ey$", re.IGNORECASE), r"\1ies"),
    (re.compile(r"([^aeiouy]|qu)y$", re.IGNORECASE), r"\1ies"),
    (re.compile(r"(?:(kni|wi|li)fe|(ar|l|ea|eo|oa|hoo)f)$", re.IGNORECASE), r"\1\2ves"),
    (re.compile(r"sis$", re.IGNORECASE), "ses"),
    (re.compile(r"(her|at|gr)o$", re.IGNORECASE), r"\1oes"),
    (re.compile(r"(seraph|cherub)(?:im)?$", re.IGNORECASE), r"\1im"),
    (re.compile(r"(alumn|alg|vertebr)(?:a|ae)$", re.IGNORECASE), r"\1ae"),
    (re.compile(r"([^l]ias|[aeiou]las|[ejzr]as|[iu]am)$", re.IGNORECASE), r"\1"),
    (re.compile(r"(e[mn]u)s?$", re.IGNORECASE), r"\1s"),
    (re.compile(r"(alias|[^aou]us|t[lm]as|gas|ris)$", re.IGNORECASE), r"\1es"),
    (re.compile(r"(ax|test)is$", re.IGNORECASE), r"\1es"),
    (re.compile(r"([^aeiou]ese)$", re.IGNORECASE), r"\1"),
    (re.compile(r"s?$", re.IGNORECASE), "s"),
]

RESOURCE_ATTRIBUTE_OVERRIDES = {
    "BYOK": "byok",
    "Object ACL": "object_acls",
    "SCIM": "scim",
    "SLO": "slo",
    "SMS": "sms",
}


def parse_tag(tag: str) -> tuple[str, str]:
    service, *resource_parts = tag.split(" - ")
    return service.strip().lower(), " - ".join(resource_parts).strip()


def to_pascal(value: str) -> str:
    return "".join(part[:1].upper() + part[1:] for part in re.split(r"[\s\-_]+", value) if part)


def to_camel(value: str) -> str:
    pascal = to_pascal(value)
    return pascal[:1].lower() + pascal[1:]


def to_kebab(value: str) -> str:
    value = re.sub(r"([a-z])([A-Z])", r"\1-\2", value)
    value = re.sub(r"[\s_]+", "-", value)
    return value.lower()


def to_snake(value: str) -> str:
    value = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", value)
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", value)
    value = re.sub(r"[^0-9A-Za-z]+", "_", value)
    result = value.strip("_").lower() or "value"
    if result[:1].isdigit():
        result = f"value_{result}"
    if keyword.iskeyword(result) or result in RESERVED_PYTHON_NAMES:
        return f"{result}_"
    return result


def pluralize(word: str) -> str:
    lower = word.lower()
    if lower in UNCOUNTABLE:
        return word
    for rule in UNCOUNTABLE_RULES:
        if rule.search(word):
            return word
    irregular = IRREGULARS.get(lower)
    if irregular is not None:
        return word[:1] + irregular[1:]
    for rule, replacement in PLURAL_RULES:
        if rule.search(word):
            return rule.sub(replacement, word, count=1)
    return f"{word}s"


def operation_id_to_method_name(
    operation_id: str,
    service_pascal: str,
    resource_pascal: str,
) -> str:
    service_resource = f"{service_pascal}{resource_pascal}"
    candidates = [
        pluralize(service_resource),
        service_resource,
        pluralize(resource_pascal),
        resource_pascal,
        service_pascal,
    ]
    for token in candidates:
        index = operation_id.find(token)
        if index < 0:
            continue
        result = f"{operation_id[:index]}{operation_id[index + len(token):]}"
        if result:
            return result[:1].lower() + result[1:]
    return operation_id


def resource_attribute_name(resource: str) -> str:
    override = RESOURCE_ATTRIBUTE_OVERRIDES.get(resource)
    if override is not None:
        return override
    return to_snake(pluralize(resource))


def strip_v1(path: str) -> str:
    return path.removeprefix("/v1/").removeprefix("v1/")
