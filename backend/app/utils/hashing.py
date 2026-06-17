import hashlib
import json


def compute_event_hash(previous_hash: str | None, data: dict) -> str:
    content = json.dumps(data, sort_keys=True, default=str)
    if previous_hash:
        content = previous_hash + content
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def compute_consent_hash(consent_data: dict) -> str:
    content = json.dumps(consent_data, sort_keys=True, default=str)
    return hashlib.sha256(content.encode("utf-8")).hexdigest()
