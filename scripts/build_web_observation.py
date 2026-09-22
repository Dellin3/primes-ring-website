#!/usr/bin/env python3
"""Build a browser-optimized scientific observation from a verified full CSV.

The input manifest and processed CSV remain private. Public output contains only
explicitly selected PDS-documented numerical fields and sanitized provenance.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import os
import shutil
import struct
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Sequence


SCRIPT_VERSION = "1.1.0"
DEFAULT_MANIFEST = Path("_research_private/data_provenance/dataset_manifest.json")
DEFAULT_PUBLIC_ROOT = Path("public/data/observations")
DEFAULT_CHUNK_SIZE = 8192
DEFAULT_OVERVIEW_BUCKET_SIZE = 1024
DEFAULT_EXACT_WINDOW_RECORDS = 32768
RADIUS_SOURCE_COLUMN = "RING RADIUS"
PRIMARY_VARIABLES = (
    {
        "id": "optical_depth",
        "label": "Normal Optical Depth",
        "source_column": "NORMAL OPTICAL DEPTH",
    },
    {
        "id": "signal_power",
        "label": "Normalized Signal Power",
        "source_column": "NORMALIZED SIGNAL POWER",
    },
    {
        "id": "phase_shift",
        "label": "Phase Shift",
        "source_column": "PHASE SHIFT",
    },
)


class BuildError(RuntimeError):
    """Raised when a source or generated product fails a required check."""


@dataclass(frozen=True)
class PublishedColumn:
    identifier: str
    label: str
    source_column: str
    unit: str | None
    description: str | None

    def index_record(self) -> dict[str, Any]:
        return {
            "id": self.identifier,
            "label": self.label,
            "source_column": self.source_column,
            "unit": self.unit,
        }

    def metadata_record(self, binary_column_index: int) -> dict[str, Any]:
        return {
            **self.index_record(),
            "binary_column_index": binary_column_index,
            "storage": "Float64",
            "description": self.description,
        }


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise BuildError(f"cannot read JSON {path}: {exc}") from exc


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(
        payload,
        indent=2,
        ensure_ascii=False,
        allow_nan=False,
    )
    path.write_text(f"{serialized}\n", encoding="utf-8", newline="\n")


def resolve_from_repo(path_value: str, repo_root: Path) -> Path:
    path = Path(path_value)
    return path if path.is_absolute() else repo_root / path


def manifest_record(manifest_path: Path, dataset_id: str) -> dict[str, Any]:
    manifest = read_json(manifest_path)
    if not isinstance(manifest, list):
        raise BuildError(f"{manifest_path}: expected a JSON array")
    matches = [
        record
        for record in manifest
        if isinstance(record, dict) and record.get("dataset_id") == dataset_id
    ]
    if len(matches) != 1:
        raise BuildError(
            f"{manifest_path}: expected one record for {dataset_id!r}, "
            f"found {len(matches)}"
        )
    return matches[0]


def column_by_name(record: dict[str, Any]) -> dict[str, dict[str, Any]]:
    definitions = record.get("column_definitions")
    if not isinstance(definitions, list):
        raise BuildError("manifest column_definitions must be a list")
    columns: dict[str, dict[str, Any]] = {}
    for definition in definitions:
        if not isinstance(definition, dict) or not definition.get("name"):
            raise BuildError("manifest contains a malformed column definition")
        name = str(definition["name"])
        if name in columns:
            raise BuildError(f"manifest contains duplicate column {name!r}")
        columns[name] = definition
    return columns


def published_columns(record: dict[str, Any]) -> list[PublishedColumn]:
    definitions = column_by_name(record)
    if RADIUS_SOURCE_COLUMN not in definitions:
        raise BuildError(
            f"authoritative label does not define {RADIUS_SOURCE_COLUMN!r}"
        )

    radius = definitions[RADIUS_SOURCE_COLUMN]
    selected = [
        PublishedColumn(
            identifier="ring_radius_km",
            label="Ring Radius",
            source_column=RADIUS_SOURCE_COLUMN,
            unit=radius.get("unit"),
            description=radius.get("description"),
        )
    ]
    for variable in PRIMARY_VARIABLES:
        source_column = variable["source_column"]
        if source_column not in definitions:
            continue
        definition = definitions[source_column]
        selected.append(
            PublishedColumn(
                identifier=str(variable["id"]),
                label=str(variable["label"]),
                source_column=str(source_column),
                unit=definition.get("unit"),
                description=definition.get("description"),
            )
        )

    if len(selected) == 1:
        raise BuildError("label supports none of the requested primary variables")
    return selected


def verified_conversion_metadata(
    processed_csv_path: Path,
    record: dict[str, Any],
) -> dict[str, Any]:
    metadata_path = processed_csv_path.with_suffix(".metadata.json")
    metadata = read_json(metadata_path)
    validation = metadata.get("validation", {})
    required_truths = (
        "first_record_matches",
        "final_record_matches",
        "field_count_matches",
    )
    if validation.get("status") != "pass":
        raise BuildError(f"{metadata_path}: private conversion status is not pass")
    if any(validation.get(key) is not True for key in required_truths):
        raise BuildError(f"{metadata_path}: private conversion checks are incomplete")
    expected_records = int(record["file_records"])
    if (
        metadata.get("row_count") != expected_records
        or validation.get("parsed_tab_records") != expected_records
        or validation.get("generated_csv_records") != expected_records
    ):
        raise BuildError(f"{metadata_path}: private record counts disagree")
    if validation.get("missing_value_count") != 0:
        raise BuildError(f"{metadata_path}: private source contains missing values")
    return metadata


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def phase_value_index(columns: Sequence[PublishedColumn]) -> int | None:
    for index, column in enumerate(columns):
        if column.identifier == "phase_shift":
            return index + 1
    return None


def overview_selection_for_bucket(
    bucket: Sequence[tuple[Any, ...]],
    phase_index: int | None,
) -> list[tuple[Any, ...]]:
    """Select real source rows without inferring phase continuity.

    Radius-ordered bucket endpoints are always retained. Optical-depth and
    signal-power extrema are retained as additional source rows. Phase is
    carried through at those rows but does not influence row selection because
    its continuity and period are not established by the preserved metadata.
    """
    if not bucket:
        return []
    selected_indices = {0, len(bucket) - 1}
    for value_index in range(2, len(bucket[0])):
        if value_index == phase_index:
            continue
        selected_indices.add(
            min(range(len(bucket)), key=lambda index: bucket[index][value_index])
        )
        selected_indices.add(
            max(range(len(bucket)), key=lambda index: bucket[index][value_index])
        )
    return [bucket[index] for index in sorted(selected_indices)]


def public_metadata(
    record: dict[str, Any],
    columns: Sequence[PublishedColumn],
    value_ranges: dict[str, dict[str, float]],
    chunk_size: int,
    chunk_count: int,
    overview_bucket_size: int,
    overview_point_count: int,
    exact_byte_length: int,
    processed_validation: dict[str, Any],
) -> dict[str, Any]:
    published_names = {
        column.source_column: column.label for column in columns
    }
    all_fields = []
    for definition in record["column_definitions"]:
        all_fields.append(
            {
                "source_column_name": definition["name"],
                "user_facing_name": published_names.get(
                    definition["name"], definition["name"]
                ),
                "column_number": definition["column_number"],
                "data_type": definition["data_type"],
                "unit": definition.get("unit"),
                "meaning": definition.get("description"),
                "provenance_status": "documented_by_pds_label",
                **(
                    {"reference_time": definition["reference_time"]}
                    if "reference_time" in definition
                    else {}
                ),
            }
        )

    variables = []
    for index, column in enumerate(columns):
        if column.identifier == "ring_radius_km":
            continue
        variable = column.metadata_record(index)
        variable["verified_value_range"] = value_ranges[column.identifier]
        if column.identifier == "phase_shift":
            variable["display_semantics"] = {
                "representation": "stored source phase samples",
                "overview_rendering": "unconnected source-sample points",
                "exact_rendering": "unconnected exact converted sample points",
                "continuity": "not inferred from the preserved metadata",
                "transformation": "none",
                "unwrapped": False,
            }
        variables.append(variable)
    conversion_validation = processed_validation["validation"]
    source_statement = (
        "Browser-specific derivative of a conversion-verified Cassini RSS PDS3 "
        "diffraction-limited profile. It contains four selected Float64 fields "
        "and is not the original PDS ASCII table."
    )
    provenance_chain = [
        {
            "id": "nasa_pds",
            "label": "NASA PDS",
            "details": {
                "pds_version_id": record["pds_version_id"],
                "data_set_id": record["data_set_id"],
            },
        },
        {
            "id": "cassini_rss",
            "label": "Cassini RSS",
            "details": {
                "instrument_host_name": record["mission_instrument_metadata"][
                    "instrument_host_name"
                ],
                "instrument_name": record["mission_instrument_metadata"][
                    "instrument_name"
                ],
                "instrument_id": record["mission_instrument_metadata"][
                    "instrument_id"
                ],
            },
        },
        {
            "id": "dlp_product",
            "label": "DLP Product",
            "details": {
                "ring_observation_id": record["ring_observation_id"],
                "product_id": record["product_id"],
                "product_type": record["product_type"],
                "source_product_id": record["source_product_id"],
            },
        },
        {
            "id": "pds3_label_tab",
            "label": "PDS3 Label + TAB",
            "details": {
                "record_type": record["record_type"],
                "record_bytes": record["record_bytes"],
                "file_records": record["file_records"],
                "documented_columns": len(record["column_definitions"]),
            },
        },
        {
            "id": "verified_conversion",
            "label": "Verified Local Conversion",
            "details": {
                "status": conversion_validation["status"],
                "parsed_tab_records": conversion_validation["parsed_tab_records"],
                "generated_csv_records": conversion_validation[
                    "generated_csv_records"
                ],
                "first_record_matches": conversion_validation[
                    "first_record_matches"
                ],
                "final_record_matches": conversion_validation[
                    "final_record_matches"
                ],
                "field_count_matches": conversion_validation[
                    "field_count_matches"
                ],
            },
        },
        {
            "id": "web_product",
            "label": "Web Scientific Data Product",
            "details": {
                "integrity_status": "build_invariants_pass",
                "verification_script": "scripts/verify_web_observation.py",
                "storage": "Float64 little-endian, row-major interleaved",
                "published_columns": len(columns),
                "chunk_size_records": chunk_size,
                "chunk_count": chunk_count,
                "exact_byte_length": exact_byte_length,
                "overview_bucket_size": overview_bucket_size,
                "overview_point_count": overview_point_count,
            },
        },
        {
            "id": "visualization",
            "label": "Current Visualization",
            "details": {
                "profile_renderer": "HTML Canvas",
                "overview_role": "display only",
                "exact_sample_role": "on-demand converted-sample inspection",
            },
        },
    ]

    return {
        "schema_version": 1,
        "web_product_version": SCRIPT_VERSION,
        "dataset_id": record["dataset_id"],
        "display_name": record["display_name"],
        "source_statement": source_statement,
        "pds_identity": {
            "pds_version_id": record["pds_version_id"],
            "data_set_id": record["data_set_id"],
            "ring_observation_id": record["ring_observation_id"],
            "product_id": record["product_id"],
            "product_type": record["product_type"],
            "product_creation_time": record.get("product_creation_time"),
            "producer_id": record.get("producer_id"),
            "source_product_id": record.get("source_product_id"),
        },
        "observation": {
            "revolution_number": record["revolution_number"],
            "band": record["band"],
            "dsn_station_number": record["dsn_station_number"],
            "ring_occultation_direction": record[
                "ring_occultation_direction"
            ],
            "ring_profile_direction": record["ring_profile_direction"],
            "observation_type": record["mission_instrument_metadata"][
                "observation_type"
            ],
            "target_name": record["mission_instrument_metadata"]["target_name"],
            "record_count": record["file_records"],
            "record_bytes": record["record_bytes"],
            "documented_time_fields": record["documented_time_fields"],
            "radial_range": {
                "minimum": record["table_definition"][
                    "minimum_sampling_parameter"
                ],
                "maximum": record["table_definition"][
                    "maximum_sampling_parameter"
                ],
                "unit": record["table_definition"]["sampling_parameter_unit"],
                "sampling_interval": record["table_definition"][
                    "sampling_parameter_interval"
                ],
            },
        },
        "instrument": record["mission_instrument_metadata"],
        "principal_variables": variables,
        "binary_columns": [
            column.metadata_record(index)
            for index, column in enumerate(columns)
        ],
        "field_documentation": all_fields,
        "data_product": {
            "overview": "overview.json",
            "index": "index.json",
            "exact_directory": "exact/",
            "recommended_exact_window_records": DEFAULT_EXACT_WINDOW_RECORDS,
        },
        "conversion_validation": {
            "status": conversion_validation["status"],
            "expected_file_records": conversion_validation[
                "expected_file_records"
            ],
            "parsed_tab_records": conversion_validation["parsed_tab_records"],
            "generated_csv_records": conversion_validation[
                "generated_csv_records"
            ],
            "first_record_matches": conversion_validation[
                "first_record_matches"
            ],
            "final_record_matches": conversion_validation[
                "final_record_matches"
            ],
            "field_count_matches": conversion_validation[
                "field_count_matches"
            ],
            "missing_value_count": conversion_validation[
                "missing_value_count"
            ],
        },
        "web_data_validation": {
            "status": "build_invariants_pass",
            "verification_script": "scripts/verify_web_observation.py",
            "exact_record_count": record["file_records"],
            "exact_chunk_count": chunk_count,
            "exact_byte_length": exact_byte_length,
            "overview_point_count": overview_point_count,
        },
        "provenance_chain": provenance_chain,
    }


def build_product(
    repo_root: Path,
    manifest_path: Path,
    public_root: Path,
    dataset_id: str,
    chunk_size: int,
    overview_bucket_size: int,
) -> dict[str, Any]:
    if chunk_size < 1 or overview_bucket_size < 1:
        raise BuildError("chunk and overview bucket sizes must be positive")

    record = manifest_record(manifest_path, dataset_id)
    processed_csv_path = resolve_from_repo(
        str(record["processed_csv_path"]), repo_root
    )
    if not processed_csv_path.is_file():
        raise BuildError(
            f"conversion-verified processed CSV is absent: {processed_csv_path}"
        )
    processed_metadata = verified_conversion_metadata(
        processed_csv_path, record
    )
    columns = published_columns(record)
    phase_index = phase_value_index(columns)
    source_column_names = [column.source_column for column in columns]
    expected_records = int(record["file_records"])
    expected_chunk_count = math.ceil(expected_records / chunk_size)
    filename_digits = max(3, len(str(max(0, expected_chunk_count - 1))))

    public_root.mkdir(parents=True, exist_ok=True)
    final_directory = public_root / dataset_id
    temporary_directory = public_root / f".{dataset_id}.building"
    if temporary_directory.exists():
        shutil.rmtree(temporary_directory)
    temporary_directory.mkdir(parents=True)
    exact_directory = temporary_directory / "exact"
    exact_directory.mkdir()

    binary_struct = struct.Struct("<" + ("d" * len(columns)))
    chunks: list[dict[str, Any]] = []
    chunk_rows: list[tuple[Any, ...]] = []
    overview_bucket: list[tuple[Any, ...]] = []
    overview_points: list[tuple[Any, ...]] = []
    row_count = 0
    previous_radius: float | None = None
    value_minimums = [math.inf] * len(columns)
    value_maximums = [-math.inf] * len(columns)

    def flush_chunk() -> None:
        nonlocal chunk_rows
        if not chunk_rows:
            return
        chunk_number = len(chunks)
        filename = f"chunk_{chunk_number:0{filename_digits}d}.bin"
        data = b"".join(
            binary_struct.pack(*[float(value) for value in row[1:]])
            for row in chunk_rows
        )
        path = exact_directory / filename
        path.write_bytes(data)
        chunks.append(
            {
                "chunk": chunk_number,
                "first_sample_index": chunk_rows[0][0],
                "last_sample_index": chunk_rows[-1][0],
                "radius_minimum_km": chunk_rows[0][1],
                "radius_maximum_km": chunk_rows[-1][1],
                "row_count": len(chunk_rows),
                "file_name": f"exact/{filename}",
                "byte_length": len(data),
                "sha256": sha256_bytes(data),
            }
        )
        chunk_rows = []

    def flush_overview_bucket() -> None:
        nonlocal overview_bucket
        if not overview_bucket:
            return
        overview_points.extend(
            overview_selection_for_bucket(
                overview_bucket,
                phase_index,
            )
        )
        overview_bucket = []

    try:
        with processed_csv_path.open(
            "r", encoding="utf-8", newline=""
        ) as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames is None:
                raise BuildError(f"{processed_csv_path}: CSV header is absent")
            missing_columns = [
                name for name in source_column_names if name not in reader.fieldnames
            ]
            if missing_columns:
                raise BuildError(
                    f"{processed_csv_path}: required documented columns absent: "
                    + ", ".join(missing_columns)
                )

            for sample_index, source_row in enumerate(reader):
                values: list[float] = []
                for source_column in source_column_names:
                    raw_value = source_row.get(source_column, "").strip()
                    if not raw_value:
                        raise BuildError(
                            f"{processed_csv_path}: blank {source_column!r} "
                            f"at sample {sample_index}"
                        )
                    try:
                        value = float(raw_value.replace("D", "E").replace("d", "e"))
                    except ValueError as exc:
                        raise BuildError(
                            f"{processed_csv_path}: invalid {source_column!r} "
                            f"at sample {sample_index}: {raw_value!r}"
                        ) from exc
                    if not math.isfinite(value):
                        raise BuildError(
                            f"{processed_csv_path}: non-finite {source_column!r} "
                            f"at sample {sample_index}"
                        )
                    values.append(value)
                    value_index = len(values) - 1
                    value_minimums[value_index] = min(
                        value_minimums[value_index], value
                    )
                    value_maximums[value_index] = max(
                        value_maximums[value_index], value
                    )

                radius = values[0]
                if previous_radius is not None and radius <= previous_radius:
                    raise BuildError(
                        f"{processed_csv_path}: radius is not strictly increasing "
                        f"at sample {sample_index}"
                    )
                previous_radius = radius
                row = (sample_index, *values)
                chunk_rows.append(row)
                overview_bucket.append(row)
                row_count += 1
                if len(chunk_rows) == chunk_size:
                    flush_chunk()
                if len(overview_bucket) == overview_bucket_size:
                    flush_overview_bucket()

        flush_chunk()
        flush_overview_bucket()
        if row_count != expected_records:
            raise BuildError(
                f"{processed_csv_path}: read {row_count} rows, "
                f"expected {expected_records}"
            )
        if len(chunks) != expected_chunk_count:
            raise BuildError(
                f"generated {len(chunks)} chunks, expected {expected_chunk_count}"
            )

        exact_byte_length = sum(chunk["byte_length"] for chunk in chunks)
        value_ranges = {
            column.identifier: {
                "minimum": value_minimums[index],
                "maximum": value_maximums[index],
            }
            for index, column in enumerate(columns)
        }
        overview_payload = {
            "schema_version": 1,
            "dataset_id": dataset_id,
            "overview_type": "display-only source-sample reduction",
            "source": "exact converted PDS-derived samples",
            "selection_method": (
                "Within each radius-ordered bucket, retain first and last source "
                "records plus the minimum and maximum source records for normal "
                "optical depth and normalized signal power; deduplicate by source "
                "sample index. Phase values are carried through only at those "
                "selected source records and rendered as unconnected points; no "
                "phase continuity or extrema preservation is inferred."
            ),
            "variable_methods": {
                "optical_depth": "deterministic extrema-preserving source rows",
                "signal_power": "deterministic extrema-preserving source rows",
                "phase_shift": (
                    "values at deterministically selected source rows; unconnected "
                    "point rendering with no continuity or extrema claim"
                ),
            },
            "bucket_size_records": overview_bucket_size,
            "bucket_count": math.ceil(row_count / overview_bucket_size),
            "source_record_count": row_count,
            "columns": [
                "sample_index",
                *[column.identifier for column in columns],
            ],
            "point_count": len(overview_points),
            "points": [list(point) for point in overview_points],
        }
        index_payload = {
            "schema_version": 1,
            "dataset_id": dataset_id,
            "storage": {
                "data_type": "Float64",
                "byte_order": "little-endian",
                "layout": "row-major interleaved",
                "bytes_per_value": 8,
                "bytes_per_record": binary_struct.size,
                "columns": [
                    column.index_record() for column in columns
                ],
            },
            "chunk_size_records": chunk_size,
            "total_records": row_count,
            "chunk_count": len(chunks),
            "chunks": chunks,
        }
        metadata_payload = public_metadata(
            record=record,
            columns=columns,
            value_ranges=value_ranges,
            chunk_size=chunk_size,
            chunk_count=len(chunks),
            overview_bucket_size=overview_bucket_size,
            overview_point_count=len(overview_points),
            exact_byte_length=exact_byte_length,
            processed_validation=processed_metadata,
        )
        write_json(temporary_directory / "metadata.json", metadata_payload)
        write_json(temporary_directory / "overview.json", overview_payload)
        write_json(temporary_directory / "index.json", index_payload)

        if final_directory.exists():
            shutil.rmtree(final_directory)
        os.replace(temporary_directory, final_directory)
    except Exception:
        shutil.rmtree(temporary_directory, ignore_errors=True)
        raise

    total_size = sum(
        path.stat().st_size
        for path in final_directory.rglob("*")
        if path.is_file()
    )
    return {
        "dataset_id": dataset_id,
        "record_count": row_count,
        "chunk_size_records": chunk_size,
        "chunk_count": len(chunks),
        "exact_byte_length": exact_byte_length,
        "overview_bucket_size": overview_bucket_size,
        "overview_point_count": len(overview_points),
        "overview_byte_length": (
            final_directory / "overview.json"
        ).stat().st_size,
        "total_byte_length": total_size,
        "output_directory": final_directory,
    }


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Build one browser-optimized observation from the verified "
            "manifest and full private CSV."
        )
    )
    parser.add_argument("--dataset-id", required=True)
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
    )
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--public-root", type=Path, default=DEFAULT_PUBLIC_ROOT)
    parser.add_argument("--chunk-size", type=int, default=DEFAULT_CHUNK_SIZE)
    parser.add_argument(
        "--overview-bucket-size",
        type=int,
        default=DEFAULT_OVERVIEW_BUCKET_SIZE,
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    repo_root = args.repo_root.resolve()
    manifest_path = resolve_from_repo(str(args.manifest), repo_root)
    public_root = resolve_from_repo(str(args.public_root), repo_root)
    try:
        result = build_product(
            repo_root=repo_root,
            manifest_path=manifest_path,
            public_root=public_root,
            dataset_id=args.dataset_id,
            chunk_size=args.chunk_size,
            overview_bucket_size=args.overview_bucket_size,
        )
    except (BuildError, OSError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(
        f"Built {result['dataset_id']}: {result['record_count']} records, "
        f"{result['chunk_count']} chunks × up to "
        f"{result['chunk_size_records']} rows"
    )
    print(
        f"Exact: {result['exact_byte_length']} bytes; overview: "
        f"{result['overview_point_count']} points / "
        f"{result['overview_byte_length']} bytes; total: "
        f"{result['total_byte_length']} bytes"
    )
    print(f"Output: {result['output_directory']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
