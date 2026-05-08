#!/usr/bin/env python
from __future__ import annotations

import argparse
import json
import sys
import warnings
from pathlib import Path

warnings.filterwarnings(
    "ignore",
    category=DeprecationWarning,
    message=r".*RefResolver is deprecated.*"
)

from jsonschema import Draft202012Validator
from jsonschema.exceptions import ValidationError
from jsonschema.validators import RefResolver
from jsonschema.validators import validator_for


def load_json(path: Path) -> object:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def build_validator(schema_path: Path) -> Draft202012Validator:
    schema = load_json(schema_path)
    validator_cls = validator_for(schema)
    validator_cls.check_schema(schema)
    resolver = RefResolver(base_uri=schema_path.resolve().as_uri(), referrer=schema)
    return validator_cls(schema, resolver=resolver)


def format_error(error: ValidationError) -> str:
    instance_path = ".".join(str(part) for part in error.absolute_path)
    if not instance_path:
        instance_path = "<root>"
    return f"{instance_path}: {error.message}"


def validate_json(schema_path: Path, input_path: Path) -> tuple[bool, str]:
    validator = build_validator(schema_path)
    payload = load_json(input_path)
    errors = sorted(validator.iter_errors(payload), key=lambda item: list(item.absolute_path))

    if not errors:
        return True, f"VALID: {input_path}"

    first_error = format_error(errors[0])
    return False, f"INVALID: {input_path}\n{first_error}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate a JSON file against a JSON Schema.")
    parser.add_argument("--schema", required=True, help="Path to the JSON Schema file.")
    parser.add_argument("--input", required=True, help="Path to the JSON document to validate.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    schema_path = Path(args.schema).resolve()
    input_path = Path(args.input).resolve()

    try:
        valid, message = validate_json(schema_path, input_path)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    except json.JSONDecodeError as exc:
        print(f"ERROR: invalid JSON in {exc.doc}", file=sys.stderr)
        return 2
    except Exception as exc:  # pragma: no cover - defensive CLI guard
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    print(message)
    return 0 if valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
