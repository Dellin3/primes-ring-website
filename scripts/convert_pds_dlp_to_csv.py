#!/usr/bin/env python3
"""Build a manifest and convert detached Cassini RSS PDS3 DLP products.

The PDS3 label is authoritative: column names, byte locations, types, units,
and record counts are read from each matching label before conversion.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Iterator, Sequence


SCRIPT_VERSION = "1.0.0"
SCRIPT_RELATIVE_PATH = "scripts/convert_pds_dlp_to_csv.py"

DEFAULT_RAW_ROOT = Path("_research_private/Cassini Raw")
DEFAULT_MANIFEST = Path("_research_private/data_provenance/dataset_manifest.json")
DEFAULT_OUTPUT_DIR = Path("_research_private/processed/full")
DEFAULT_REPORT = Path("_research_private/data_provenance/conversion_report.md")

TIME_FIELD_KEYS = (
    "EARTH_RECEIVED_START_TIME",
    "EARTH_RECEIVED_STOP_TIME",
    "RING_EVENT_START_TIME",
    "RING_EVENT_STOP_TIME",
    "SPACECRAFT_EVENT_START_TIME",
    "SPACECRAFT_EVENT_STOP_TIME",
    "SPACECRAFT_CLOCK_START_COUNT",
    "SPACECRAFT_CLOCK_STOP_COUNT",
)

MISSION_INSTRUMENT_KEYS = (
    "INSTRUMENT_HOST_NAME",
    "INSTRUMENT_HOST_ID",
    "INSTRUMENT_NAME",
    "INSTRUMENT_ID",
    "MISSION_PHASE_NAME",
    "TARGET_NAME",
    "OBSERVATION_TYPE",
    "OCCULTATION_TYPE",
    "FEATURE_NAME",
    "PLANETARY_OCCULTATION_FLAG",
)

SPECIAL_CONSTANT_KEYS = (
    "MISSING_CONSTANT",
    "INVALID_CONSTANT",
    "NOT_APPLICABLE_CONSTANT",
    "UNKNOWN_CONSTANT",
    "SATURATION_CONSTANT",
    "HIGH_INSTR_SATURATION",
    "HIGH_REPR_SATURATION",
    "LOW_INSTR_SATURATION",
    "LOW_REPR_SATURATION",
)

NUMERIC_REAL_RE = re.compile(
    r"^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[EeDd][+-]?\d+)?$"
)
INTEGER_RE = re.compile(r"^[+-]?\d+$")
NONNEGATIVE_INTEGER_RE = re.compile(r"^\+?\d+$")
QUANTITY_RE = re.compile(
    r"^([+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[EeDd][+-]?\d+)?)"
    r"\s*<([^>]+)>$"
)


class PipelineError(RuntimeError):
    """Base class for explicit ingestion failures."""


class LabelError(PipelineError):
    """Raised when a PDS3 label is missing or ambiguous."""


class ConversionError(PipelineError):
    """Raised when a TAB or generated CSV fails validation."""


@dataclass(frozen=True)
class ColumnDefinition:
    """One PDS3 COLUMN object."""

    attributes: dict[str, Any]

    @property
    def name(self) -> str:
        return str(self.attributes["NAME"])

    @property
    def number(self) -> int:
        return _as_int(self.attributes["COLUMN_NUMBER"], "COLUMN_NUMBER")

    @property
    def data_type(self) -> str:
        return str(self.attributes["DATA_TYPE"])

    @property
    def start_byte(self) -> int | None:
        value = self.attributes.get("START_BYTE")
        return None if value is None else _as_int(value, "START_BYTE")

    @property
    def byte_count(self) -> int | None:
        value = self.attributes.get("BYTES")
        return None if value is None else _as_int(value, "BYTES")

    @property
    def unit(self) -> str | None:
        value = self.attributes.get("UNIT")
        return None if value is None else str(value)

    def to_manifest(self) -> dict[str, Any]:
        key_map = (
            ("NAME", "name"),
            ("COLUMN_NUMBER", "column_number"),
            ("DATA_TYPE", "data_type"),
            ("START_BYTE", "start_byte"),
            ("BYTES", "bytes"),
            ("FORMAT", "format"),
            ("UNIT", "unit"),
            ("REFERENCE_TIME", "reference_time"),
            ("DESCRIPTION", "description"),
        )
        result = {
            output_key: self.attributes[pds_key]
            for pds_key, output_key in key_map
            if pds_key in self.attributes
        }
        special_constants = {
            key.lower(): self.attributes[key]
            for key in SPECIAL_CONSTANT_KEYS
            if key in self.attributes
        }
        if special_constants:
            result["special_constants"] = special_constants
        return result


@dataclass(frozen=True)
class LabelDefinition:
    """The root metadata and one detached tabular object from a PDS3 label."""

    path: Path
    root: dict[str, Any]
    object_type: str
    table: dict[str, Any]
    columns: tuple[ColumnDefinition, ...]

    @property
    def record_type(self) -> str:
        return str(self.root.get("RECORD_TYPE", "")).upper()

    @property
    def record_bytes(self) -> int:
        return _as_int(_require(self.root, "RECORD_BYTES", self.path), "RECORD_BYTES")

    @property
    def file_records(self) -> int:
        return _as_int(_require(self.root, "FILE_RECORDS", self.path), "FILE_RECORDS")

    @property
    def row_bytes(self) -> int:
        return _as_int(_require(self.table, "ROW_BYTES", self.path), "ROW_BYTES")

    @property
    def rows(self) -> int:
        return _as_int(_require(self.table, "ROWS", self.path), "ROWS")

    @property
    def pointer(self) -> str:
        value = _require(self.root, f"^{self.object_type}", self.path)
        if not isinstance(value, str):
            raise LabelError(
                f"{self.path}: ^{self.object_type} must be one detached filename"
            )
        return value


@dataclass
class ConversionResult:
    """Verified conversion facts used for metadata and the report."""

    dataset_id: str
    tab_path: str
    label_path: str
    expected_records: int
    parsed_records: int | None
    column_count: int | None
    radial_minimum: Decimal | None
    radial_maximum: Decimal | None
    radial_unit: str | None
    status: str
    warnings: list[str]


def _require(mapping: dict[str, Any], key: str, source: Path) -> Any:
    if key not in mapping:
        raise LabelError(f"{source}: required PDS keyword {key} is absent")
    return mapping[key]


def _as_int(value: Any, field_name: str) -> int:
    if isinstance(value, bool):
        raise LabelError(f"{field_name} must be an integer, not a boolean")
    if isinstance(value, int):
        return value
    if isinstance(value, float) and value.is_integer():
        return int(value)
    try:
        return int(str(value))
    except (TypeError, ValueError) as exc:
        raise LabelError(f"{field_name} is not an integer: {value!r}") from exc


def _snake_case(key: str) -> str:
    return key.lower()


def _collapse_label_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _strip_pds_comments(text: str) -> str:
    return re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)


def _value_is_complete(value: str) -> bool:
    quote: str | None = None
    parentheses = 0
    braces = 0
    index = 0
    while index < len(value):
        char = value[index]
        if quote:
            if char == quote:
                if index + 1 < len(value) and value[index + 1] == quote:
                    index += 1
                else:
                    quote = None
        elif char in {'"', "'"}:
            quote = char
        elif char == "(":
            parentheses += 1
        elif char == ")":
            parentheses -= 1
        elif char == "{":
            braces += 1
        elif char == "}":
            braces -= 1
        if parentheses < 0 or braces < 0:
            return False
        index += 1
    return quote is None and parentheses == 0 and braces == 0


def _iter_pds_statements(text: str, source: Path) -> Iterator[tuple[str, str | None]]:
    pending: str | None = None
    for physical_line in _strip_pds_comments(text).splitlines():
        stripped = physical_line.strip()
        if pending is not None:
            pending = f"{pending}\n{stripped}"
            _, value = pending.split("=", 1)
            if _value_is_complete(value):
                key, complete_value = pending.split("=", 1)
                yield key.strip(), complete_value.strip()
                pending = None
            continue

        if not stripped:
            continue
        if stripped == "END":
            yield "END", None
            continue
        if "=" not in stripped:
            raise LabelError(f"{source}: unrecognized PDS statement {stripped!r}")

        key, value = stripped.split("=", 1)
        if _value_is_complete(value):
            yield key.strip(), value.strip()
        else:
            pending = stripped

    if pending is not None:
        raise LabelError(f"{source}: unterminated multi-line PDS value")


def _split_pds_sequence(value: str) -> list[str]:
    parts: list[str] = []
    current: list[str] = []
    quote: str | None = None
    nested = 0
    index = 0
    for char in value:
        if quote:
            current.append(char)
            if char == quote:
                if index + 1 < len(value) and value[index + 1] == quote:
                    continue
                quote = None
        elif char in {'"', "'"}:
            quote = char
            current.append(char)
        elif char in "({":
            nested += 1
            current.append(char)
        elif char in ")}":
            nested -= 1
            current.append(char)
        elif char == "," and nested == 0:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(char)
        index += 1
    parts.append("".join(current).strip())
    return parts


def _parse_pds_value(raw_value: str) -> Any:
    value = raw_value.strip()
    if len(value) >= 2 and value[0] in {'"', "'"} and value[-1] == value[0]:
        quote = value[0]
        return _collapse_label_text(value[1:-1].replace(quote * 2, quote))

    if (
        len(value) >= 2
        and (value[0], value[-1]) in {("(", ")"), ("{", "}")}
    ):
        inner = value[1:-1].strip()
        if not inner:
            return []
        return [_parse_pds_value(part) for part in _split_pds_sequence(inner)]

    quantity_match = QUANTITY_RE.fullmatch(value)
    if quantity_match:
        number_text, unit = quantity_match.groups()
        return {"value": _parse_pds_number(number_text), "unit": unit}

    if INTEGER_RE.fullmatch(value):
        return int(value)
    if NUMERIC_REAL_RE.fullmatch(value):
        return float(value.replace("D", "E").replace("d", "e"))
    return value


def _parse_pds_number(value: str) -> int | float:
    if INTEGER_RE.fullmatch(value):
        return int(value)
    return float(value.replace("D", "E").replace("d", "e"))


def _store_unique(
    mapping: dict[str, Any], key: str, value: Any, source: Path
) -> None:
    if key in mapping:
        raise LabelError(f"{source}: duplicate PDS keyword {key} is ambiguous")
    mapping[key] = value


def parse_pds3_label(path: Path) -> LabelDefinition:
    """Parse and validate one detached PDS3 TABLE or SERIES label."""

    try:
        text = path.read_text(encoding="ascii")
    except (OSError, UnicodeDecodeError) as exc:
        raise LabelError(f"cannot read ASCII PDS label {path}: {exc}") from exc

    root: dict[str, Any] = {}
    top_objects: list[dict[str, Any]] = []
    stack: list[dict[str, Any]] = []
    reached_end = False

    for key, raw_value in _iter_pds_statements(text, path):
        if key == "END":
            if stack:
                raise LabelError(f"{path}: END encountered before END_OBJECT")
            reached_end = True
            continue
        if reached_end:
            raise LabelError(f"{path}: content follows the PDS END statement")
        if raw_value is None:
            raise LabelError(f"{path}: PDS keyword {key} has no value")

        value = _parse_pds_value(raw_value)
        if key == "OBJECT":
            object_type = str(value).upper()
            node = {
                "object_type": object_type,
                "attributes": {},
                "children": [],
            }
            if stack:
                stack[-1]["children"].append(node)
            else:
                top_objects.append(node)
            stack.append(node)
            continue

        if key == "END_OBJECT":
            if not stack:
                raise LabelError(f"{path}: END_OBJECT without OBJECT")
            expected = stack[-1]["object_type"]
            if str(value).upper() != expected:
                raise LabelError(
                    f"{path}: END_OBJECT={value} does not close OBJECT={expected}"
                )
            stack.pop()
            continue

        target = stack[-1]["attributes"] if stack else root
        _store_unique(target, key, value, path)

    if not reached_end:
        raise LabelError(f"{path}: PDS END statement is absent")
    if str(root.get("PDS_VERSION_ID", "")).upper() != "PDS3":
        raise LabelError(f"{path}: only PDS3 labels are supported")

    data_objects = [
        item for item in top_objects if item["object_type"] in {"TABLE", "SERIES"}
    ]
    if len(data_objects) != 1:
        raise LabelError(
            f"{path}: expected exactly one TABLE or SERIES object, "
            f"found {len(data_objects)}"
        )

    data_object = data_objects[0]
    object_type = str(data_object["object_type"])
    table = data_object["attributes"]
    column_nodes = [
        child
        for child in data_object["children"]
        if child["object_type"] == "COLUMN"
    ]
    if len(column_nodes) != len(data_object["children"]):
        raise LabelError(f"{path}: unsupported nested object in {object_type}")

    columns = tuple(
        sorted(
            (ColumnDefinition(child["attributes"]) for child in column_nodes),
            key=lambda column: column.number,
        )
    )
    definition = LabelDefinition(path, root, object_type, table, columns)
    _validate_label_definition(definition)
    return definition


def _validate_label_definition(label: LabelDefinition) -> None:
    expected_columns = _as_int(
        _require(label.table, "COLUMNS", label.path), "COLUMNS"
    )
    if expected_columns != len(label.columns):
        raise LabelError(
            f"{label.path}: COLUMNS={expected_columns}, but "
            f"{len(label.columns)} COLUMN objects were parsed"
        )
    if [column.number for column in label.columns] != list(
        range(1, expected_columns + 1)
    ):
        raise LabelError(f"{label.path}: COLUMN_NUMBER values are not 1..COLUMNS")
    if len({column.name for column in label.columns}) != len(label.columns):
        raise LabelError(f"{label.path}: duplicate COLUMN NAME values are ambiguous")
    if label.file_records != label.rows:
        raise LabelError(
            f"{label.path}: FILE_RECORDS={label.file_records} differs from "
            f"{label.object_type}.ROWS={label.rows}"
        )
    if str(label.table.get("INTERCHANGE_FORMAT", "")).upper() != "ASCII":
        raise LabelError(f"{label.path}: only ASCII table interchange is supported")

    if label.record_type == "FIXED_LENGTH":
        if label.record_bytes != label.row_bytes:
            raise LabelError(
                f"{label.path}: RECORD_BYTES={label.record_bytes} differs from "
                f"ROW_BYTES={label.row_bytes}"
            )
        previous_end = 0
        for column in label.columns:
            if column.start_byte is None or column.byte_count is None:
                raise LabelError(
                    f"{label.path}: fixed-length column {column.name!r} lacks "
                    "START_BYTE or BYTES"
                )
            if column.start_byte <= previous_end:
                raise LabelError(
                    f"{label.path}: fixed-width columns overlap at {column.name!r}"
                )
            if column.byte_count <= 0:
                raise LabelError(
                    f"{label.path}: column {column.name!r} has non-positive BYTES"
                )
            previous_end = column.start_byte + column.byte_count - 1
            if previous_end > label.row_bytes:
                raise LabelError(
                    f"{label.path}: column {column.name!r} extends past ROW_BYTES"
                )
            _validate_declared_format_width(column, label.path)
    else:
        _delimiter_from_label(label)

    for column in label.columns:
        _validate_supported_data_type(column, label.path)


def _validate_declared_format_width(column: ColumnDefinition, source: Path) -> None:
    declared_format = column.attributes.get("FORMAT")
    if declared_format is None or column.byte_count is None:
        return
    match = re.fullmatch(r"[A-Za-z](\d+)(?:\.\d+)?", str(declared_format))
    if match and int(match.group(1)) != column.byte_count:
        raise LabelError(
            f"{source}: FORMAT={declared_format!r} and BYTES={column.byte_count} "
            f"disagree for column {column.name!r}"
        )


def _validate_supported_data_type(column: ColumnDefinition, source: Path) -> None:
    supported = {
        "ASCII_REAL",
        "ASCII_INTEGER",
        "ASCII_NONNEGATIVE_INTEGER",
        "ASCII_NUMERIC_BASE16",
        "CHARACTER",
        "ASCII_DATE",
        "ASCII_DATE_TIME",
        "ASCII_BOOLEAN",
    }
    if column.data_type.upper() not in supported:
        raise LabelError(
            f"{source}: unsupported DATA_TYPE={column.data_type!r} for "
            f"column {column.name!r}; conversion will not infer a parser"
        )


def _delimiter_from_label(label: LabelDefinition) -> str:
    raw_delimiter = label.table.get(
        "FIELD_DELIMITER", label.root.get("FIELD_DELIMITER")
    )
    if raw_delimiter is None:
        raise LabelError(
            f"{label.path}: RECORD_TYPE={label.record_type!r} is not fixed-length "
            "and no FIELD_DELIMITER is documented"
        )
    delimiter_name = str(raw_delimiter)
    delimiters = {
        "COMMA": ",",
        "TAB": "\t",
        "SEMICOLON": ";",
        "VERTICAL_BAR": "|",
    }
    delimiter = delimiters.get(delimiter_name.upper(), delimiter_name)
    if len(delimiter) != 1:
        raise LabelError(
            f"{label.path}: unsupported FIELD_DELIMITER={raw_delimiter!r}"
        )
    return delimiter


def discover_observation_pairs(raw_root: Path) -> list[tuple[Path, Path]]:
    """Discover every detached DLP 500 m label and its exact pointer target."""

    labels = sorted(raw_root.rglob("*_DLP_500M.LBL"))
    tabs = sorted(raw_root.rglob("*_DLP_500M.TAB"))
    if not labels:
        raise LabelError(f"no *_DLP_500M.LBL files found under {raw_root}")

    remaining_tabs = {path.resolve() for path in tabs}
    pairs: list[tuple[Path, Path]] = []
    for label_path in labels:
        label = parse_pds3_label(label_path)
        pointer_path = (label_path.parent / label.pointer).resolve()
        if not pointer_path.is_file():
            raise LabelError(
                f"{label_path}: detached data pointer does not exist: {label.pointer}"
            )
        if pointer_path not in remaining_tabs:
            raise LabelError(
                f"{label_path}: pointer {label.pointer!r} is not a unique matching "
                "*_DLP_500M.TAB product"
            )
        if pointer_path.stem != label_path.stem:
            raise LabelError(
                f"{label_path}: label and TAB basenames do not match exactly"
            )
        pairs.append((label_path.resolve(), pointer_path))
        remaining_tabs.remove(pointer_path)

    if remaining_tabs:
        unpaired = ", ".join(str(path) for path in sorted(remaining_tabs))
        raise LabelError(f"unpaired *_DLP_500M.TAB files found: {unpaired}")
    return pairs


def _path_for_json(path: Path, repo_root: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(repo_root.resolve()).as_posix()
    except ValueError:
        return resolved.as_posix()


def _stable_dataset_id(product_id: str) -> str:
    without_extension = re.sub(r"\.TAB$", "", product_id, flags=re.IGNORECASE)
    stable_id = re.sub(r"[^a-z0-9]+", "_", without_extension.lower()).strip("_")
    if not stable_id:
        raise LabelError(f"cannot derive a stable dataset_id from {product_id!r}")
    return stable_id


def _output_filename(label: LabelDefinition) -> str:
    revolution = _as_int(
        _require(label.root, "REVOLUTION_NUMBER", label.path), "REVOLUTION_NUMBER"
    )
    band = str(_require(label.root, "BAND_NAME", label.path)).lower()
    station = _as_int(
        _require(label.root, "DSN_STATION_NUMBER", label.path),
        "DSN_STATION_NUMBER",
    )
    profile_direction = str(
        _require(label.root, "RING_PROFILE_DIRECTION", label.path)
    ).upper()
    direction_code = {"INGRESS": "i", "EGRESS": "e"}.get(profile_direction)
    if direction_code is None:
        raise LabelError(
            f"{label.path}: unsupported RING_PROFILE_DIRECTION={profile_direction!r}; "
            "an output-name direction will not be guessed"
        )
    safe_band = re.sub(r"[^a-z0-9]+", "", band)
    if not safe_band:
        raise LabelError(f"{label.path}: BAND_NAME cannot form an output filename")
    return f"rev{revolution:03d}{direction_code}_{safe_band}{station}_dlp_full.csv"


def _display_name(label: LabelDefinition) -> str:
    revolution = _as_int(label.root["REVOLUTION_NUMBER"], "REVOLUTION_NUMBER")
    profile_direction = str(label.root["RING_PROFILE_DIRECTION"]).title()
    band = str(label.root["BAND_NAME"])
    station = _as_int(label.root["DSN_STATION_NUMBER"], "DSN_STATION_NUMBER")
    return (
        f"Cassini RSS Rev {revolution:03d} {profile_direction}, "
        f"{band}-band, DSN {station}, DLP 500 m"
    )


def _documented_radial_range(root: dict[str, Any]) -> dict[str, Any] | None:
    minimum = root.get("MINIMUM_RING_RADIUS")
    maximum = root.get("MAXIMUM_RING_RADIUS")
    if minimum is None and maximum is None:
        return None
    result: dict[str, Any] = {}
    if minimum is not None:
        result["minimum"] = minimum
    if maximum is not None:
        result["maximum"] = maximum
    return result


def _table_manifest(label: LabelDefinition) -> dict[str, Any]:
    key_map = (
        ("NAME", "name"),
        ("INTERCHANGE_FORMAT", "interchange_format"),
        ("COLUMNS", "columns"),
        ("ROWS", "rows"),
        ("ROW_BYTES", "row_bytes"),
        ("FIELD_DELIMITER", "field_delimiter"),
        ("SAMPLING_PARAMETER_NAME", "sampling_parameter_name"),
        ("SAMPLING_PARAMETER_UNIT", "sampling_parameter_unit"),
        ("MINIMUM_SAMPLING_PARAMETER", "minimum_sampling_parameter"),
        ("MAXIMUM_SAMPLING_PARAMETER", "maximum_sampling_parameter"),
        ("SAMPLING_PARAMETER_INTERVAL", "sampling_parameter_interval"),
        ("DESCRIPTION", "description"),
        ("USAGE_NOTE", "usage_note"),
    )
    result: dict[str, Any] = {"object_type": label.object_type}
    result.update(
        {
            output_key: label.table[pds_key]
            for pds_key, output_key in key_map
            if pds_key in label.table
        }
    )
    return result


def manifest_record(
    label: LabelDefinition,
    tab_path: Path,
    repo_root: Path,
    output_dir: Path,
) -> dict[str, Any]:
    """Create one label-derived manifest record without outside metadata."""

    root = label.root
    product_id = str(_require(root, "PRODUCT_ID", label.path))
    output_csv_path = output_dir / _output_filename(label)
    time_fields = {
        _snake_case(key): root[key] for key in TIME_FIELD_KEYS if key in root
    }
    mission_metadata = {
        _snake_case(key): root[key]
        for key in MISSION_INSTRUMENT_KEYS
        if key in root
    }
    column_definitions = [column.to_manifest() for column in label.columns]
    column_units = {
        column.name: column.unit
        for column in label.columns
        if column.unit is not None
    }

    record: dict[str, Any] = {
        "dataset_id": _stable_dataset_id(product_id),
        "display_name": _display_name(label),
        "pds_version_id": _require(root, "PDS_VERSION_ID", label.path),
        "data_set_id": _require(root, "DATA_SET_ID", label.path),
        "revolution_number": _as_int(
            _require(root, "REVOLUTION_NUMBER", label.path), "REVOLUTION_NUMBER"
        ),
        "ring_observation_id": _require(
            root, "RING_OBSERVATION_ID", label.path
        ),
        "product_id": product_id,
        "product_type": _require(root, "PRODUCT_TYPE", label.path),
        "product_creation_time": root.get("PRODUCT_CREATION_TIME"),
        "producer_id": root.get("PRODUCER_ID"),
        "band": _require(root, "BAND_NAME", label.path),
        "dsn_station_number": _as_int(
            _require(root, "DSN_STATION_NUMBER", label.path),
            "DSN_STATION_NUMBER",
        ),
        "ring_occultation_direction": root.get("RING_OCCULTATION_DIRECTION"),
        "ring_profile_direction": root.get("RING_PROFILE_DIRECTION"),
        "raw_tab_path": _path_for_json(tab_path, repo_root),
        "label_path": _path_for_json(label.path, repo_root),
        "processed_csv_path": _path_for_json(output_csv_path, repo_root),
        "record_type": _require(root, "RECORD_TYPE", label.path),
        "file_records": label.file_records,
        "record_bytes": label.record_bytes,
        "documented_time_fields": time_fields,
        "source_product_id": root.get("SOURCE_PRODUCT_ID"),
        "mission_instrument_metadata": mission_metadata,
        "table_definition": _table_manifest(label),
        "column_definitions": column_definitions,
        "column_units": column_units,
        "provenance_status": "raw_pds_product_present",
    }
    radial_range = _documented_radial_range(root)
    if radial_range is not None:
        record["documented_radial_range"] = radial_range
    return record


def _write_json_atomic(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(payload, indent=2, ensure_ascii=False, allow_nan=False)
    _write_text_atomic(path, f"{serialized}\n")


def _write_text_atomic(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8",
        newline="\n",
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp",
        delete=False,
    ) as handle:
        temporary_path = Path(handle.name)
        handle.write(text)
    os.replace(temporary_path, path)


def build_manifest(
    raw_root: Path,
    manifest_path: Path,
    output_dir: Path,
    repo_root: Path,
) -> list[dict[str, Any]]:
    pairs = discover_observation_pairs(raw_root)
    records = [
        manifest_record(
            parse_pds3_label(label_path), tab_path, repo_root, output_dir
        )
        for label_path, tab_path in pairs
    ]
    dataset_ids = [record["dataset_id"] for record in records]
    output_paths = [record["processed_csv_path"] for record in records]
    if len(set(dataset_ids)) != len(dataset_ids):
        raise LabelError("derived dataset_id values are not unique")
    if len(set(output_paths)) != len(output_paths):
        raise LabelError("derived processed CSV paths are not unique")
    _write_json_atomic(manifest_path, records)
    return records


def _resolve_manifest_path(value: str, repo_root: Path) -> Path:
    path = Path(value)
    return path if path.is_absolute() else repo_root / path


def load_manifest(path: Path) -> list[dict[str, Any]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise PipelineError(f"cannot read manifest {path}: {exc}") from exc
    if not isinstance(payload, list) or not payload:
        raise PipelineError(f"{path}: manifest must be a non-empty JSON array")
    if not all(isinstance(record, dict) for record in payload):
        raise PipelineError(f"{path}: every manifest entry must be an object")
    return payload


def _assert_manifest_matches_label(
    record: dict[str, Any], label: LabelDefinition, tab_path: Path
) -> None:
    root = label.root
    product_id = str(root.get("PRODUCT_ID", ""))
    time_fields = {
        _snake_case(key): root[key] for key in TIME_FIELD_KEYS if key in root
    }
    mission_metadata = {
        _snake_case(key): root[key]
        for key in MISSION_INSTRUMENT_KEYS
        if key in root
    }
    checks = {
        "dataset_id": _stable_dataset_id(product_id),
        "display_name": _display_name(label),
        "pds_version_id": root.get("PDS_VERSION_ID"),
        "data_set_id": root.get("DATA_SET_ID"),
        "ring_observation_id": root.get("RING_OBSERVATION_ID"),
        "product_id": product_id,
        "product_type": root.get("PRODUCT_TYPE"),
        "product_creation_time": root.get("PRODUCT_CREATION_TIME"),
        "producer_id": root.get("PRODUCER_ID"),
        "revolution_number": root.get("REVOLUTION_NUMBER"),
        "band": root.get("BAND_NAME"),
        "dsn_station_number": root.get("DSN_STATION_NUMBER"),
        "ring_occultation_direction": root.get("RING_OCCULTATION_DIRECTION"),
        "ring_profile_direction": root.get("RING_PROFILE_DIRECTION"),
        "record_type": root.get("RECORD_TYPE"),
        "file_records": label.file_records,
        "record_bytes": label.record_bytes,
        "documented_time_fields": time_fields,
        "source_product_id": root.get("SOURCE_PRODUCT_ID"),
        "mission_instrument_metadata": mission_metadata,
        "table_definition": _table_manifest(label),
        "column_definitions": [
            column.to_manifest() for column in label.columns
        ],
        "column_units": {
            column.name: column.unit
            for column in label.columns
            if column.unit is not None
        },
        "provenance_status": "raw_pds_product_present",
        "documented_radial_range": _documented_radial_range(root),
    }
    for field_name, label_value in checks.items():
        if record.get(field_name) != label_value:
            raise ConversionError(
                f"{record.get('dataset_id', '<unknown>')}: manifest {field_name} "
                f"does not match {label.path}"
            )
    pointer_target = (label.path.parent / label.pointer).resolve()
    if tab_path.resolve() != pointer_target:
        raise ConversionError(
            f"{record.get('dataset_id', '<unknown>')}: manifest TAB is not the "
            f"^{label.object_type} pointer target"
        )


def _is_within(path: Path, parent: Path) -> bool:
    try:
        path.resolve().relative_to(parent.resolve())
        return True
    except ValueError:
        return False


def _special_constant_tokens(column: ColumnDefinition) -> set[str]:
    tokens: set[str] = set()
    for key in SPECIAL_CONSTANT_KEYS:
        if key not in column.attributes:
            continue
        value = column.attributes[key]
        values = value if isinstance(value, list) else [value]
        for item in values:
            if isinstance(item, dict) and "value" in item:
                item = item["value"]
            tokens.add(str(item))
    return tokens


def _validate_field_value(
    value: str,
    column: ColumnDefinition,
    row_number: int,
    source: Path,
    special_tokens: set[str],
) -> None:
    if value == "" or value in special_tokens:
        return
    data_type = column.data_type.upper()
    is_valid = True
    if data_type == "ASCII_REAL":
        is_valid = NUMERIC_REAL_RE.fullmatch(value) is not None
    elif data_type == "ASCII_INTEGER":
        is_valid = INTEGER_RE.fullmatch(value) is not None
    elif data_type == "ASCII_NONNEGATIVE_INTEGER":
        is_valid = NONNEGATIVE_INTEGER_RE.fullmatch(value) is not None
    elif data_type == "ASCII_NUMERIC_BASE16":
        is_valid = re.fullmatch(r"[0-9A-Fa-f]+", value) is not None
    elif data_type == "ASCII_BOOLEAN":
        is_valid = value.upper() in {"TRUE", "FALSE", "T", "F", "Y", "N"}
    elif data_type in {"CHARACTER", "ASCII_DATE", "ASCII_DATE_TIME"}:
        is_valid = True

    if not is_valid:
        raise ConversionError(
            f"{source}: row {row_number}, column {column.number} "
            f"({column.name!r}) is not valid {column.data_type}: {value!r}"
        )


def _fixed_layout_ranges(
    columns: Sequence[ColumnDefinition], record_bytes: int
) -> list[tuple[int, int]]:
    ranges: list[tuple[int, int]] = []
    cursor = 0
    for column in columns:
        assert column.start_byte is not None
        assert column.byte_count is not None
        start = column.start_byte - 1
        if start > cursor:
            ranges.append((cursor, start))
        cursor = start + column.byte_count
    if cursor < record_bytes:
        ranges.append((cursor, record_bytes))
    return ranges


def _fixed_values(
    raw_record: bytes,
    columns: Sequence[ColumnDefinition],
    row_number: int,
    source: Path,
) -> list[str]:
    values: list[str] = []
    for column in columns:
        assert column.start_byte is not None
        assert column.byte_count is not None
        start = column.start_byte - 1
        field_bytes = raw_record[start : start + column.byte_count]
        try:
            field = field_bytes.decode("ascii")
        except UnicodeDecodeError as exc:
            raise ConversionError(
                f"{source}: row {row_number}, column {column.number} "
                "contains non-ASCII bytes"
            ) from exc
        values.append(field.strip())
    return values


def _decimal_value(value: str, source: Path, row_number: int) -> Decimal:
    try:
        return Decimal(value.replace("D", "E").replace("d", "e"))
    except InvalidOperation as exc:
        raise ConversionError(
            f"{source}: row {row_number} radius value is not numeric: {value!r}"
        ) from exc


def _radius_column_index(label: LabelDefinition) -> int | None:
    sampling_name = label.table.get("SAMPLING_PARAMETER_NAME")
    if sampling_name is not None and "RADIUS" in str(sampling_name).upper():
        for index, column in enumerate(label.columns):
            if column.name == sampling_name:
                return index
        raise LabelError(
            f"{label.path}: SAMPLING_PARAMETER_NAME={sampling_name!r} does not "
            "match a COLUMN NAME"
        )
    for index, column in enumerate(label.columns):
        if column.name.upper() == "RING RADIUS":
            return index
    return None


def _decimal_from_label_value(value: Any) -> Decimal | None:
    if value is None:
        return None
    if isinstance(value, dict):
        value = value.get("value")
    try:
        return Decimal(str(value))
    except InvalidOperation:
        return None


def _check_documented_radial_range(
    label: LabelDefinition,
    minimum: Decimal | None,
    maximum: Decimal | None,
) -> list[str]:
    if minimum is None or maximum is None:
        return []
    warnings: list[str] = []
    comparisons = (
        (
            "MINIMUM_SAMPLING_PARAMETER",
            label.table.get("MINIMUM_SAMPLING_PARAMETER"),
            minimum,
        ),
        (
            "MAXIMUM_SAMPLING_PARAMETER",
            label.table.get("MAXIMUM_SAMPLING_PARAMETER"),
            maximum,
        ),
        ("MINIMUM_RING_RADIUS", label.root.get("MINIMUM_RING_RADIUS"), minimum),
        ("MAXIMUM_RING_RADIUS", label.root.get("MAXIMUM_RING_RADIUS"), maximum),
    )
    for field_name, documented_value, parsed_value in comparisons:
        documented_decimal = _decimal_from_label_value(documented_value)
        if documented_decimal is not None and documented_decimal != parsed_value:
            warnings.append(
                f"{field_name}={documented_decimal} differs from parsed "
                f"range value {parsed_value}"
            )
    return warnings


def _update_value_counts(
    values: Sequence[str],
    columns: Sequence[ColumnDefinition],
    row_number: int,
    source: Path,
    special_tokens: Sequence[set[str]],
    missing_counts: list[int],
    special_counts: list[int],
) -> None:
    if len(values) != len(columns):
        raise ConversionError(
            f"{source}: row {row_number} has {len(values)} fields; "
            f"the label defines {len(columns)}"
        )
    for index, (value, column) in enumerate(zip(values, columns)):
        if value == "":
            missing_counts[index] += 1
        elif value in special_tokens[index]:
            special_counts[index] += 1
        _validate_field_value(
            value, column, row_number, source, special_tokens[index]
        )


def _write_fixed_csv(
    tab_path: Path,
    temporary_csv_path: Path,
    label: LabelDefinition,
) -> tuple[
    int,
    list[str],
    list[str],
    list[int],
    list[int],
    Decimal | None,
    Decimal | None,
]:
    record_bytes = label.record_bytes
    file_size = tab_path.stat().st_size
    if file_size % record_bytes != 0:
        raise ConversionError(
            f"{tab_path}: {file_size} bytes is not divisible by "
            f"RECORD_BYTES={record_bytes}"
        )
    physical_records = file_size // record_bytes
    if physical_records != label.file_records:
        raise ConversionError(
            f"{tab_path}: file size implies {physical_records} records, but "
            f"FILE_RECORDS={label.file_records}"
        )

    layout_ranges = _fixed_layout_ranges(label.columns, record_bytes)
    expected_layout: list[bytes] | None = None
    allowed_layout_bytes = set(b" \t,\r\n")
    special_tokens = [_special_constant_tokens(column) for column in label.columns]
    missing_counts = [0] * len(label.columns)
    special_counts = [0] * len(label.columns)
    first_values: list[str] | None = None
    final_values: list[str] | None = None
    row_count = 0
    radius_index = _radius_column_index(label)
    radial_minimum: Decimal | None = None
    radial_maximum: Decimal | None = None

    with tab_path.open("rb") as raw_handle, temporary_csv_path.open(
        "w", encoding="utf-8", newline=""
    ) as csv_handle:
        writer = csv.writer(csv_handle, lineterminator="\n")
        writer.writerow([column.name for column in label.columns])

        while True:
            raw_record = raw_handle.read(record_bytes)
            if not raw_record:
                break
            row_count += 1
            if len(raw_record) != record_bytes:
                raise ConversionError(
                    f"{tab_path}: row {row_count} has {len(raw_record)} bytes; "
                    f"RECORD_BYTES={record_bytes}"
                )
            layout = [raw_record[start:end] for start, end in layout_ranges]
            if expected_layout is None:
                if any(
                    byte not in allowed_layout_bytes
                    for segment in layout
                    for byte in segment
                ):
                    raise ConversionError(
                        f"{tab_path}: bytes outside labeled columns contain "
                        "undocumented non-layout characters"
                    )
                expected_layout = layout
            elif layout != expected_layout:
                raise ConversionError(
                    f"{tab_path}: row {row_count} has a different fixed-record "
                    "separator/terminator layout"
                )

            values = _fixed_values(
                raw_record, label.columns, row_count, tab_path
            )
            _update_value_counts(
                values,
                label.columns,
                row_count,
                tab_path,
                special_tokens,
                missing_counts,
                special_counts,
            )
            if first_values is None:
                first_values = values.copy()
            final_values = values.copy()

            if radius_index is not None:
                radius_text = values[radius_index]
                if radius_text:
                    radius = _decimal_value(radius_text, tab_path, row_count)
                    radial_minimum = (
                        radius
                        if radial_minimum is None
                        else min(radial_minimum, radius)
                    )
                    radial_maximum = (
                        radius
                        if radial_maximum is None
                        else max(radial_maximum, radius)
                    )
            writer.writerow(values)

    if first_values is None or final_values is None:
        raise ConversionError(f"{tab_path}: no data records were parsed")
    return (
        row_count,
        first_values,
        final_values,
        missing_counts,
        special_counts,
        radial_minimum,
        radial_maximum,
    )


def _write_delimited_csv(
    tab_path: Path,
    temporary_csv_path: Path,
    label: LabelDefinition,
) -> tuple[
    int,
    list[str],
    list[str],
    list[int],
    list[int],
    Decimal | None,
    Decimal | None,
]:
    delimiter = _delimiter_from_label(label)
    special_tokens = [_special_constant_tokens(column) for column in label.columns]
    missing_counts = [0] * len(label.columns)
    special_counts = [0] * len(label.columns)
    first_values: list[str] | None = None
    final_values: list[str] | None = None
    row_count = 0
    radius_index = _radius_column_index(label)
    radial_minimum: Decimal | None = None
    radial_maximum: Decimal | None = None

    with tab_path.open("r", encoding="ascii", newline="") as raw_handle, (
        temporary_csv_path.open("w", encoding="utf-8", newline="")
    ) as csv_handle:
        reader = csv.reader(raw_handle, delimiter=delimiter, strict=True)
        writer = csv.writer(csv_handle, lineterminator="\n")
        writer.writerow([column.name for column in label.columns])
        try:
            for row_count, values in enumerate(reader, start=1):
                _update_value_counts(
                    values,
                    label.columns,
                    row_count,
                    tab_path,
                    special_tokens,
                    missing_counts,
                    special_counts,
                )
                if first_values is None:
                    first_values = values.copy()
                final_values = values.copy()
                if radius_index is not None and values[radius_index]:
                    radius = _decimal_value(
                        values[radius_index], tab_path, row_count
                    )
                    radial_minimum = (
                        radius
                        if radial_minimum is None
                        else min(radial_minimum, radius)
                    )
                    radial_maximum = (
                        radius
                        if radial_maximum is None
                        else max(radial_maximum, radius)
                    )
                writer.writerow(values)
        except (csv.Error, UnicodeDecodeError) as exc:
            raise ConversionError(
                f"{tab_path}: malformed delimited record near row {row_count}: {exc}"
            ) from exc

    if first_values is None or final_values is None:
        raise ConversionError(f"{tab_path}: no data records were parsed")
    return (
        row_count,
        first_values,
        final_values,
        missing_counts,
        special_counts,
        radial_minimum,
        radial_maximum,
    )


def _validate_generated_csv(
    csv_path: Path,
    columns: Sequence[ColumnDefinition],
    expected_records: int,
    raw_first: Sequence[str],
    raw_final: Sequence[str],
) -> int:
    csv_count = 0
    csv_first: list[str] | None = None
    csv_final: list[str] | None = None
    try:
        with csv_path.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.reader(handle, strict=True)
            header = next(reader)
            expected_header = [column.name for column in columns]
            if header != expected_header:
                raise ConversionError(
                    f"{csv_path}: generated header does not preserve PDS COLUMN names"
                )
            for csv_count, values in enumerate(reader, start=1):
                if len(values) != len(columns):
                    raise ConversionError(
                        f"{csv_path}: generated row {csv_count} has "
                        f"{len(values)} fields; expected {len(columns)}"
                    )
                if csv_first is None:
                    csv_first = values.copy()
                csv_final = values.copy()
    except (OSError, csv.Error, UnicodeDecodeError, StopIteration) as exc:
        if isinstance(exc, ConversionError):
            raise
        raise ConversionError(f"cannot validate generated CSV {csv_path}: {exc}") from exc

    if csv_count != expected_records:
        raise ConversionError(
            f"{csv_path}: generated CSV has {csv_count} records; "
            f"expected {expected_records}"
        )
    if csv_first != list(raw_first):
        raise ConversionError(
            f"{csv_path}: first generated record does not match first TAB record"
        )
    if csv_final != list(raw_final):
        raise ConversionError(
            f"{csv_path}: final generated record does not match final TAB record"
        )
    return csv_count


def _count_map(
    columns: Sequence[ColumnDefinition], counts: Sequence[int]
) -> dict[str, int]:
    return {
        column.name: count
        for column, count in zip(columns, counts)
        if count > 0
    }


def _radial_unit(label: LabelDefinition, radius_index: int | None) -> str | None:
    if radius_index is None:
        return None
    return label.columns[radius_index].unit or (
        str(label.table["SAMPLING_PARAMETER_UNIT"])
        if "SAMPLING_PARAMETER_UNIT" in label.table
        else None
    )


def convert_one(
    record: dict[str, Any],
    repo_root: Path,
) -> ConversionResult:
    required_manifest_keys = (
        "dataset_id",
        "raw_tab_path",
        "label_path",
        "processed_csv_path",
        "file_records",
        "column_definitions",
    )
    missing_keys = [key for key in required_manifest_keys if key not in record]
    if missing_keys:
        raise ConversionError(
            f"manifest record lacks required keys: {', '.join(missing_keys)}"
        )

    dataset_id = str(record["dataset_id"])
    tab_path = _resolve_manifest_path(str(record["raw_tab_path"]), repo_root)
    label_path = _resolve_manifest_path(str(record["label_path"]), repo_root)
    output_path = _resolve_manifest_path(
        str(record["processed_csv_path"]), repo_root
    )
    if output_path.suffix.lower() != ".csv":
        raise ConversionError(
            f"{dataset_id}: processed_csv_path must have a .csv extension"
        )
    if _is_within(output_path, repo_root / "public"):
        raise ConversionError(
            f"{dataset_id}: refusing to write a full DLP product under public/"
        )
    if not tab_path.is_file() or not label_path.is_file():
        raise ConversionError(
            f"{dataset_id}: source TAB or LBL path from the manifest is absent"
        )

    label = parse_pds3_label(label_path)
    _assert_manifest_matches_label(record, label, tab_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    radius_index = _radius_column_index(label)

    with tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8",
        dir=output_path.parent,
        prefix=f".{output_path.name}.",
        suffix=".tmp",
        delete=False,
    ) as temporary_handle:
        temporary_csv_path = Path(temporary_handle.name)

    try:
        if label.record_type == "FIXED_LENGTH":
            conversion = _write_fixed_csv(
                tab_path, temporary_csv_path, label
            )
        else:
            conversion = _write_delimited_csv(
                tab_path, temporary_csv_path, label
            )
        (
            parsed_records,
            raw_first,
            raw_final,
            missing_counts,
            special_counts,
            radial_minimum,
            radial_maximum,
        ) = conversion

        if parsed_records != label.file_records:
            raise ConversionError(
                f"{tab_path}: parsed {parsed_records} records; "
                f"FILE_RECORDS={label.file_records}"
            )
        csv_records = _validate_generated_csv(
            temporary_csv_path,
            label.columns,
            parsed_records,
            raw_first,
            raw_final,
        )
        warnings = _check_documented_radial_range(
            label, radial_minimum, radial_maximum
        )
        missing_by_column = _count_map(label.columns, missing_counts)
        special_by_column = _count_map(label.columns, special_counts)
        if missing_by_column:
            warnings.append(
                "Blank values preserved: "
                + ", ".join(
                    f"{name}={count}"
                    for name, count in missing_by_column.items()
                )
            )
        if special_by_column:
            warnings.append(
                "Documented special constants preserved: "
                + ", ".join(
                    f"{name}={count}"
                    for name, count in special_by_column.items()
                )
            )

        os.replace(temporary_csv_path, output_path)
    except Exception:
        temporary_csv_path.unlink(missing_ok=True)
        raise

    radial_unit = _radial_unit(label, radius_index)
    metadata_path = output_path.with_suffix(".metadata.json")
    metadata: dict[str, Any] = {
        "dataset_id": dataset_id,
        "source_tab": str(record["raw_tab_path"]),
        "source_lbl": str(record["label_path"]),
        "source_pds_product_id": label.root["PRODUCT_ID"],
        "row_count": parsed_records,
        "column_count": len(label.columns),
        "column_definitions": [
            column.to_manifest() for column in label.columns
        ],
        "units": {
            column.name: column.unit
            for column in label.columns
            if column.unit is not None
        },
        "radial_range": (
            {
                "column": label.columns[radius_index].name,
                "minimum": float(radial_minimum),
                "maximum": float(radial_maximum),
                "unit": radial_unit,
            }
            if radius_index is not None
            and radial_minimum is not None
            and radial_maximum is not None
            else None
        ),
        "conversion_timestamp": datetime.now(timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z"),
        "converter": {
            "path": SCRIPT_RELATIVE_PATH,
            "version": SCRIPT_VERSION,
        },
        "warnings": warnings,
        "validation": {
            "status": "pass" if not warnings else "pass_with_warnings",
            "expected_file_records": label.file_records,
            "parsed_tab_records": parsed_records,
            "generated_csv_records": csv_records,
            "pds_defined_column_count": len(label.columns),
            "parsed_fields_per_record": len(label.columns),
            "first_record_matches": True,
            "final_record_matches": True,
            "field_count_matches": True,
            "missing_value_count": sum(missing_counts),
            "missing_values_by_column": missing_by_column,
            "documented_special_constant_count": sum(special_counts),
            "documented_special_constants_by_column": special_by_column,
        },
    }
    _write_json_atomic(metadata_path, metadata)

    return ConversionResult(
        dataset_id=dataset_id,
        tab_path=str(record["raw_tab_path"]),
        label_path=str(record["label_path"]),
        expected_records=label.file_records,
        parsed_records=parsed_records,
        column_count=len(label.columns),
        radial_minimum=radial_minimum,
        radial_maximum=radial_maximum,
        radial_unit=radial_unit,
        status="PASS" if not warnings else "PASS WITH WARNINGS",
        warnings=warnings,
    )


def _markdown_cell(value: Any) -> str:
    return str(value).replace("|", r"\|").replace("\n", " ")


def _radial_range_for_report(result: ConversionResult) -> str:
    if result.radial_minimum is None or result.radial_maximum is None:
        return "N/A"
    unit = f" {result.radial_unit}" if result.radial_unit else ""
    return (
        f"{format(result.radial_minimum, 'f')} to "
        f"{format(result.radial_maximum, 'f')}{unit}"
    )


def write_conversion_report(
    report_path: Path,
    results: Sequence[ConversionResult],
) -> None:
    generated_at = (
        datetime.now(timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z")
    )
    lines = [
        "# Cassini RSS DLP Conversion Report",
        "",
        f"- Generated: {generated_at}",
        f"- Converter: `{SCRIPT_RELATIVE_PATH}` version `{SCRIPT_VERSION}`",
        "- Validation: PDS record/column counts plus first and final "
        "TAB-to-CSV record comparisons",
        "",
        "| Dataset | TAB file | LBL file | Expected records | Parsed records | "
        "Columns | Radial min/max | Conversion status | Warnings |",
        "|---|---|---|---:|---:|---:|---|---|---|",
    ]
    for result in results:
        warning_text = "; ".join(result.warnings) if result.warnings else "None"
        values = (
            result.dataset_id,
            result.tab_path,
            result.label_path,
            result.expected_records,
            result.parsed_records if result.parsed_records is not None else "N/A",
            result.column_count if result.column_count is not None else "N/A",
            _radial_range_for_report(result),
            result.status,
            warning_text,
        )
        lines.append("| " + " | ".join(_markdown_cell(value) for value in values) + " |")
    lines.append("")
    _write_text_atomic(report_path, "\n".join(lines))


def run_conversions(
    manifest_records: Sequence[dict[str, Any]],
    report_path: Path,
    repo_root: Path,
) -> list[ConversionResult]:
    results: list[ConversionResult] = []
    failures: list[str] = []
    seen_ids: set[str] = set()
    seen_outputs: set[str] = set()

    for record in manifest_records:
        dataset_id = str(record.get("dataset_id", "<unknown>"))
        output_path = str(record.get("processed_csv_path", ""))
        if dataset_id in seen_ids:
            failures.append(f"duplicate dataset_id in manifest: {dataset_id}")
            continue
        if output_path in seen_outputs:
            failures.append(f"duplicate processed_csv_path in manifest: {output_path}")
            continue
        seen_ids.add(dataset_id)
        seen_outputs.add(output_path)

        try:
            result = convert_one(record, repo_root)
        except (OSError, PipelineError) as exc:
            failure_message = str(exc)
            failures.append(f"{dataset_id}: {failure_message}")
            results.append(
                ConversionResult(
                    dataset_id=dataset_id,
                    tab_path=str(record.get("raw_tab_path", "N/A")),
                    label_path=str(record.get("label_path", "N/A")),
                    expected_records=_as_int(
                        record.get("file_records", 0), "file_records"
                    ),
                    parsed_records=None,
                    column_count=(
                        len(record["column_definitions"])
                        if isinstance(record.get("column_definitions"), list)
                        else None
                    ),
                    radial_minimum=None,
                    radial_maximum=None,
                    radial_unit=None,
                    status="FAIL",
                    warnings=[failure_message],
                )
            )
            continue
        results.append(result)

    write_conversion_report(report_path, results)
    if failures:
        raise ConversionError(
            f"{len(failures)} conversion(s) failed; see {report_path}:\n"
            + "\n".join(f"- {failure}" for failure in failures)
        )
    return results


def _absolute_from_repo(path: Path, repo_root: Path) -> Path:
    return path if path.is_absolute() else repo_root / path


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Build a label-derived manifest and convert detached PDS3 DLP "
            "TAB products to conversion-verified full CSV files."
        )
    )
    parser.add_argument(
        "command",
        nargs="?",
        choices=("all", "manifest", "convert"),
        default="all",
        help="all (default), manifest only, or convert an existing manifest",
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="repository root used to resolve and store relative paths",
    )
    parser.add_argument("--raw-root", type=Path, default=DEFAULT_RAW_ROOT)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    repo_root = args.repo_root.resolve()
    raw_root = _absolute_from_repo(args.raw_root, repo_root)
    manifest_path = _absolute_from_repo(args.manifest, repo_root)
    output_dir = _absolute_from_repo(args.output_dir, repo_root)
    report_path = _absolute_from_repo(args.report, repo_root)

    try:
        if _is_within(output_dir, repo_root / "public"):
            raise PipelineError("refusing to place full DLP products under public/")

        if args.command in {"all", "manifest"}:
            records = build_manifest(
                raw_root, manifest_path, output_dir, repo_root
            )
            print(
                f"Wrote {len(records)} observation records to "
                f"{_path_for_json(manifest_path, repo_root)}"
            )
        if args.command == "manifest":
            return 0

        records = load_manifest(manifest_path)
        results = run_conversions(records, report_path, repo_root)
        for result in results:
            range_text = _radial_range_for_report(result)
            print(
                f"{result.status}: {result.dataset_id}: "
                f"{result.parsed_records} rows, {result.column_count} columns, "
                f"radial range {range_text}"
            )
        print(
            f"Wrote conversion report to "
            f"{_path_for_json(report_path, repo_root)}"
        )
        return 0
    except (OSError, PipelineError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
