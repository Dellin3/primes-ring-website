#!/usr/bin/env python3
"""Read-only verification of one web observation against its full CSV."""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import math
import struct
import sys
from pathlib import Path
from typing import Any, Sequence


DEFAULT_MANIFEST = Path("_research_private/data_provenance/dataset_manifest.json")
DEFAULT_PUBLIC_ROOT = Path("public/data/observations")
MINIMUM_DETERMINISTIC_COMPARISONS = 50


class VerificationError(RuntimeError):
    """Raised when public scientific data differs from its verified conversion."""


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise VerificationError(f"cannot read JSON {path}: {exc}") from exc


def resolve_from_repo(path_value: str, repo_root: Path) -> Path:
    path = Path(path_value)
    return path if path.is_absolute() else repo_root / path


def source_manifest_record(
    manifest_path: Path, dataset_id: str
) -> dict[str, Any]:
    payload = read_json(manifest_path)
    matches = [
        record
        for record in payload
        if isinstance(record, dict) and record.get("dataset_id") == dataset_id
    ]
    if len(matches) != 1:
        raise VerificationError(
            f"expected one manifest record for {dataset_id!r}, found {len(matches)}"
        )
    return matches[0]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while block := handle.read(1024 * 1024):
            digest.update(block)
    return digest.hexdigest()


def deterministic_indices(record_count: int) -> list[int]:
    indices = {0, record_count - 1}
    counter = 0
    while len(indices) < MINIMUM_DETERMINISTIC_COMPARISONS + 2:
        indices.add((counter * 104729 + 7919) % record_count)
        counter += 1
    return sorted(indices)


from build_web_observation import overview_selection_for_bucket


def parse_source_row(
    source_row: dict[str, str], source_columns: Sequence[str], sample_index: int
) -> tuple[Any, ...]:
    values = []
    for source_column in source_columns:
        try:
            value = float(
                source_row[source_column].replace("D", "E").replace("d", "e")
            )
        except (KeyError, ValueError) as exc:
            raise VerificationError(
                f"invalid source value for {source_column!r} at {sample_index}"
            ) from exc
        if not math.isfinite(value):
            raise VerificationError(
                f"non-finite source value for {source_column!r} at {sample_index}"
            )
        values.append(value)
    return (sample_index, *values)


def exact_record(
    product_directory: Path,
    index: dict[str, Any],
    sample_index: int,
) -> tuple[float, ...]:
    chunks = index["chunks"]
    matching = next(
        (
            chunk
            for chunk in chunks
            if chunk["first_sample_index"]
            <= sample_index
            <= chunk["last_sample_index"]
        ),
        None,
    )
    if matching is None:
        raise VerificationError(f"sample {sample_index} is not indexed")
    bytes_per_record = index["storage"]["bytes_per_record"]
    column_count = len(index["storage"]["columns"])
    offset = (
        sample_index - matching["first_sample_index"]
    ) * bytes_per_record
    path = product_directory / matching["file_name"]
    with path.open("rb") as handle:
        handle.seek(offset)
        data = handle.read(bytes_per_record)
    if len(data) != bytes_per_record:
        raise VerificationError(f"sample {sample_index} is truncated")
    return struct.unpack("<" + ("d" * column_count), data)


def exact_rows_for_range(
    product_directory: Path,
    index: dict[str, Any],
    minimum_radius: float,
    maximum_radius: float,
) -> list[tuple[Any, ...]]:
    column_count = len(index["storage"]["columns"])
    row_struct = struct.Struct("<" + ("d" * column_count))
    rows: list[tuple[Any, ...]] = []
    for chunk in index["chunks"]:
        if (
            chunk["radius_maximum_km"] < minimum_radius
            or chunk["radius_minimum_km"] > maximum_radius
        ):
            continue
        data = (product_directory / chunk["file_name"]).read_bytes()
        for local_index, values in enumerate(row_struct.iter_unpack(data)):
            radius = values[0]
            if minimum_radius <= radius <= maximum_radius:
                rows.append(
                    (
                        chunk["first_sample_index"] + local_index,
                        *values,
                    )
                )
    return rows


def export_csv_text(
    dataset_id: str,
    product_id: str,
    rows: Sequence[tuple[Any, ...]],
    columns: Sequence[str],
) -> str:
    output = io.StringIO(newline="")
    minimum_radius = rows[0][1]
    maximum_radius = rows[-1][1]
    output.write("# PROJECT-EXPORTED EXACT WINDOW\n")
    output.write(f"# dataset_id: {dataset_id}\n")
    output.write(f"# product_id: {product_id}\n")
    output.write(f"# radius_minimum_km: {minimum_radius:.17g}\n")
    output.write(f"# radius_maximum_km: {maximum_radius:.17g}\n")
    output.write(f"# exact_row_count: {len(rows)}\n")
    output.write("# generated_time: 2000-01-01T00:00:00Z\n")
    output.write(
        "# source: exact non-interpolated Float64 project derivative of a "
        "conversion-verified Cassini RSS PDS3 DLP profile product; not the "
        "original PDS ASCII table\n"
    )
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(["sample_index", *columns])
    for row in rows:
        writer.writerow(
            [row[0], *[format(value, ".17g") for value in row[1:]]]
        )
    return output.getvalue()


def verify_public_path_safety(
    product_directory: Path, repo_root: Path
) -> None:
    forbidden = (
        "_research_private",
        "Cassini Raw",
        "processed/full",
        str(repo_root),
    )
    for path in product_directory.rglob("*.json"):
        text = path.read_text(encoding="utf-8")
        for marker in forbidden:
            if marker in text:
                raise VerificationError(
                    f"{path}: public JSON exposes forbidden path marker {marker!r}"
                )


def verify(
    repo_root: Path,
    manifest_path: Path,
    public_root: Path,
    dataset_id: str,
) -> dict[str, Any]:
    source_record = source_manifest_record(manifest_path, dataset_id)
    source_csv_path = resolve_from_repo(
        str(source_record["processed_csv_path"]), repo_root
    )
    product_directory = public_root / dataset_id
    metadata = read_json(product_directory / "metadata.json")
    overview = read_json(product_directory / "overview.json")
    index = read_json(product_directory / "index.json")

    if any(
        payload.get("dataset_id") != dataset_id
        for payload in (metadata, overview, index)
    ):
        raise VerificationError("dataset identifiers disagree across public files")
    if metadata["pds_identity"]["product_id"] != source_record["product_id"]:
        raise VerificationError("public PRODUCT_ID differs from the manifest")
    if metadata["pds_identity"]["ring_observation_id"] != source_record[
        "ring_observation_id"
    ]:
        raise VerificationError(
            "public RING_OBSERVATION_ID differs from the manifest"
        )

    verify_public_path_safety(product_directory, repo_root)
    chunks = index["chunks"]
    expected_first_index = 0
    exact_row_total = 0
    previous_exact_radius: float | None = None
    column_count = len(index["storage"]["columns"])
    row_struct = struct.Struct("<" + ("d" * column_count))

    for expected_chunk_number, chunk in enumerate(chunks):
        if chunk["chunk"] != expected_chunk_number:
            raise VerificationError("chunk numbers are not contiguous")
        if chunk["first_sample_index"] != expected_first_index:
            raise VerificationError(
                f"chunk {expected_chunk_number} creates a row gap or duplicate"
            )
        expected_last = (
            chunk["first_sample_index"] + chunk["row_count"] - 1
        )
        if chunk["last_sample_index"] != expected_last:
            raise VerificationError(
                f"chunk {expected_chunk_number} index bounds disagree"
            )

        path = product_directory / chunk["file_name"]
        if not path.is_file():
            raise VerificationError(f"indexed chunk is absent: {path.name}")
        if path.stat().st_size != chunk["byte_length"]:
            raise VerificationError(f"{path.name}: byte length differs from index")
        if chunk["byte_length"] != chunk["row_count"] * row_struct.size:
            raise VerificationError(
                f"{path.name}: row count does not match binary length"
            )
        if sha256_file(path) != chunk["sha256"]:
            raise VerificationError(f"{path.name}: SHA-256 mismatch")

        first_radius: float | None = None
        final_radius: float | None = None
        for values in row_struct.iter_unpack(path.read_bytes()):
            radius = values[0]
            if previous_exact_radius is not None and radius <= previous_exact_radius:
                raise VerificationError(
                    f"{path.name}: exact radii are not strictly increasing"
                )
            if first_radius is None:
                first_radius = radius
            final_radius = radius
            previous_exact_radius = radius
        if (
            first_radius != chunk["radius_minimum_km"]
            or final_radius != chunk["radius_maximum_km"]
        ):
            raise VerificationError(
                f"{path.name}: indexed radius bounds differ from binary data"
            )
        exact_row_total += chunk["row_count"]
        expected_first_index = chunk["last_sample_index"] + 1

    if exact_row_total != index["total_records"]:
        raise VerificationError("exact chunk row total differs from index")
    if exact_row_total != source_record["file_records"]:
        raise VerificationError("exact chunk row total differs from FILE_RECORDS")

    overview_rows = [tuple(point) for point in overview["points"]]
    overview_indices = [int(point[0]) for point in overview_rows]
    if overview_indices != sorted(set(overview_indices)):
        raise VerificationError("overview sample indices are not unique and ordered")

    comparison_indices = deterministic_indices(exact_row_total)
    window_first = exact_row_total // 2 - 777
    window_last = exact_row_total // 2 + 777
    required_source_indices = set(comparison_indices)
    required_source_indices.update(overview_indices)
    required_source_indices.update(range(window_first, window_last + 1))
    source_values: dict[int, tuple[Any, ...]] = {}
    recomputed_overview: list[tuple[Any, ...]] = []
    overview_bucket: list[tuple[Any, ...]] = []
    previous_source_radius: float | None = None
    source_count = 0
    phase_index = next(
        (
            column_index + 1
            for column_index, column in enumerate(index["storage"]["columns"])
            if column["id"] == "phase_shift"
        ),
        None,
    )
    source_columns = [
        column["source_column"] for column in index["storage"]["columns"]
    ]

    def append_overview_bucket(bucket: list[tuple[Any, ...]]) -> None:
        recomputed_overview.extend(
            overview_selection_for_bucket(
                bucket,
                phase_index,
            )
        )

    with source_csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise VerificationError("source CSV header is absent")
        for source_count, source_row in enumerate(reader, start=1):
            sample_index = source_count - 1
            row = parse_source_row(source_row, source_columns, sample_index)
            radius = row[1]
            if previous_source_radius is not None and radius <= previous_source_radius:
                raise VerificationError(
                    f"source radius is not increasing at {sample_index}"
                )
            previous_source_radius = radius
            if sample_index in required_source_indices:
                source_values[sample_index] = row
            overview_bucket.append(row)
            if len(overview_bucket) == overview["bucket_size_records"]:
                append_overview_bucket(overview_bucket)
                overview_bucket = []
        if overview_bucket:
            append_overview_bucket(overview_bucket)

    if source_count != exact_row_total:
        raise VerificationError("source CSV row count differs from exact chunks")
    if recomputed_overview != overview_rows:
        raise VerificationError(
            "overview does not match deterministic source-sample selection"
        )

    for sample_index in comparison_indices:
        source_row = source_values[sample_index]
        if exact_record(product_directory, index, sample_index) != source_row[1:]:
            raise VerificationError(
                f"deterministic exact comparison failed at {sample_index}"
            )

    first_exact = exact_record(product_directory, index, 0)
    final_exact = exact_record(product_directory, index, exact_row_total - 1)
    if first_exact != source_values[0][1:]:
        raise VerificationError("first exact record differs from source")
    if final_exact != source_values[exact_row_total - 1][1:]:
        raise VerificationError("last exact record differs from source")

    minimum_radius = source_values[window_first][1]
    maximum_radius = source_values[window_last][1]
    exact_window = exact_rows_for_range(
        product_directory, index, minimum_radius, maximum_radius
    )
    expected_window = [
        source_values[index]
        for index in range(window_first, window_last + 1)
    ]
    if exact_window != expected_window:
        raise VerificationError("selected-window extraction differs from source")

    exported = export_csv_text(
        dataset_id=dataset_id,
        product_id=metadata["pds_identity"]["product_id"],
        rows=exact_window,
        columns=[column["id"] for column in index["storage"]["columns"]],
    )
    data_lines = [
        line for line in exported.splitlines() if not line.startswith("#")
    ]
    exported_rows = list(csv.DictReader(data_lines))
    if len(exported_rows) != len(expected_window):
        raise VerificationError("exported window row count is incorrect")
    for exported_row, source_row in zip(exported_rows, expected_window):
        if int(exported_row["sample_index"]) != source_row[0]:
            raise VerificationError("exported sample index differs from source")
        for column_index, column in enumerate(
            index["storage"]["columns"], start=1
        ):
            if float(exported_row[column["id"]]) != source_row[column_index]:
                raise VerificationError(
                    f"exported {column['id']} differs from source"
                )

    result = {
        "schema_version": 1,
        "dataset_id": dataset_id,
        "status": "pass",
        "source_record_count": source_count,
        "exact_chunk_count": len(chunks),
        "exact_chunk_row_total": exact_row_total,
        "chunk_hashes_verified": len(chunks),
        "deterministic_record_comparisons": len(comparison_indices),
        "first_record_matches": True,
        "last_record_matches": True,
        "radius_ordering_valid": True,
        "overview_method_recomputed": True,
        "overview_points_verified": len(overview_rows),
        "selected_window": {
            "first_sample_index": window_first,
            "last_sample_index": window_last,
            "radius_minimum_km": minimum_radius,
            "radius_maximum_km": maximum_radius,
            "exact_row_count": len(exact_window),
        },
        "window_export_rows_verified": len(exported_rows),
        "public_path_safety": "pass",
    }
    return result


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Read-only verification of one public web observation against its "
            "conversion-verified private "
            "processed source."
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
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    repo_root = args.repo_root.resolve()
    try:
        result = verify(
            repo_root=repo_root,
            manifest_path=resolve_from_repo(str(args.manifest), repo_root),
            public_root=resolve_from_repo(str(args.public_root), repo_root),
            dataset_id=args.dataset_id,
        )
    except (OSError, VerificationError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(
        f"PASS: {result['dataset_id']}: "
        f"{result['exact_chunk_row_total']} rows in "
        f"{result['exact_chunk_count']} contiguous hashed chunks"
    )
    print(
        f"Compared {result['deterministic_record_comparisons']} deterministic "
        f"records; verified {result['overview_points_verified']} overview "
        f"points and {result['window_export_rows_verified']} export rows"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
