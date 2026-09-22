#!/usr/bin/env python3
"""Read-only verification of the complete public web-observation catalog."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any, Sequence

from build_web_observation import (
    DEFAULT_MANIFEST,
    DEFAULT_PUBLIC_ROOT,
)
from verify_web_observation import (
    VerificationError,
    read_json,
    resolve_from_repo,
    verify,
)


def require_equal(actual: Any, expected: Any, message: str) -> None:
    if actual != expected:
        raise VerificationError(message)


def verify_catalog(
    repo_root: Path,
    manifest_path: Path,
    public_root: Path,
) -> dict[str, Any]:
    manifest = read_json(manifest_path)
    catalog = read_json(public_root / "catalog.json")
    if not isinstance(manifest, list) or not manifest:
        raise VerificationError("source manifest must be a non-empty JSON array")

    manifest_by_id = {
        str(record["dataset_id"]): record
        for record in manifest
        if isinstance(record, dict) and record.get("dataset_id")
    }
    entries = catalog.get("observations")
    if not isinstance(entries, list):
        raise VerificationError("catalog observations must be a JSON array")
    catalog_by_id = {
        str(entry["dataset_id"]): entry
        for entry in entries
        if isinstance(entry, dict) and entry.get("dataset_id")
    }
    require_equal(
        set(catalog_by_id),
        set(manifest_by_id),
        "catalog and manifest dataset identifiers differ",
    )
    require_equal(
        catalog.get("observation_count"),
        len(entries),
        "catalog observation count is incorrect",
    )
    require_equal(
        catalog.get("validation_status"),
        "pass",
        "catalog integrity status is not pass",
    )

    forbidden_markers = (
        "_research_private",
        "Cassini Raw",
        "processed/full",
        str(repo_root),
    )
    catalog_text = (public_root / "catalog.json").read_text(encoding="utf-8")
    if any(marker in catalog_text for marker in forbidden_markers):
        raise VerificationError("catalog exposes a private path marker")

    verified_chunks = 0
    verified_rows = 0
    verified_overview_points = 0
    for dataset_id, entry in catalog_by_id.items():
        product_directory = public_root / dataset_id
        metadata = read_json(product_directory / "metadata.json")
        index = read_json(product_directory / "index.json")
        overview = read_json(product_directory / "overview.json")
        result = verify(
            repo_root=repo_root,
            manifest_path=manifest_path,
            public_root=public_root,
            dataset_id=dataset_id,
        )
        source = manifest_by_id[dataset_id]
        phase_variable = next(
            (
                variable
                for variable in metadata.get("principal_variables", [])
                if variable.get("id") == "phase_shift"
            ),
            None,
        )
        if phase_variable is None or phase_variable.get("label") != "Phase Shift":
            raise VerificationError(
                f"{dataset_id}: phase variable is absent or ambiguously labeled"
            )
        phase_semantics = phase_variable.get("display_semantics", {})
        if (
            "segment_break_threshold" in phase_semantics
            or "wrap_period" in phase_semantics
            or phase_semantics.get("transformation") != "none"
            or "not inferred" not in phase_semantics.get("continuity", "")
        ):
            raise VerificationError(
                f"{dataset_id}: unsupported phase continuity semantics remain"
            )
        index_phase = next(
            (
                column
                for column in index.get("storage", {}).get("columns", [])
                if column.get("id") == "phase_shift"
            ),
            None,
        )
        if index_phase is None or index_phase.get("label") != "Phase Shift":
            raise VerificationError(
                f"{dataset_id}: binary index phase label is stale"
            )
        phase_method = overview.get("variable_methods", {}).get("phase_shift", "")
        if "unconnected" not in phase_method or "no continuity" not in phase_method:
            raise VerificationError(
                f"{dataset_id}: overview phase method is not continuity-neutral"
            )
        require_equal(
            entry.get("product_id"),
            source.get("product_id"),
            f"{dataset_id}: catalog product identifier differs from manifest",
        )
        require_equal(
            entry.get("ring_observation_id"),
            source.get("ring_observation_id"),
            f"{dataset_id}: ring observation identifier differs from manifest",
        )
        require_equal(
            entry.get("record_count"),
            result["exact_chunk_row_total"],
            f"{dataset_id}: catalog and exact row counts differ",
        )
        web_data = entry.get("web_data", {})
        require_equal(
            web_data.get("validation_status"),
            "pass",
            f"{dataset_id}: catalog web-data integrity status is not pass",
        )
        require_equal(
            web_data.get("chunk_hashes_verified"),
            result["chunk_hashes_verified"],
            f"{dataset_id}: catalog verified-chunk count is stale",
        )
        require_equal(
            web_data.get("deterministic_record_comparisons"),
            result["deterministic_record_comparisons"],
            f"{dataset_id}: catalog comparison count is stale",
        )
        require_equal(
            entry.get("overview", {}).get("point_count"),
            result["overview_points_verified"],
            f"{dataset_id}: catalog overview count is stale",
        )
        verified_chunks += result["chunk_hashes_verified"]
        verified_rows += result["exact_chunk_row_total"]
        verified_overview_points += result["overview_points_verified"]

    legacy_public_files = sorted(public_root.parent.glob("cassini_rev*.csv"))
    if legacy_public_files:
        raise VerificationError(
            "legacy research-window CSV files remain in the public data directory"
        )

    return {
        "status": "pass",
        "observation_count": len(entries),
        "exact_rows_verified": verified_rows,
        "chunk_hashes_verified": verified_chunks,
        "overview_points_verified": verified_overview_points,
    }


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Read-only verification of catalog identities, exact chunks, "
            "overview reduction, public-path safety, and legacy-file exclusion."
        )
    )
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
        result = verify_catalog(
            repo_root=repo_root,
            manifest_path=resolve_from_repo(str(args.manifest), repo_root),
            public_root=resolve_from_repo(str(args.public_root), repo_root),
        )
    except (OSError, VerificationError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    print(
        f"PASS: {result['observation_count']} catalog observations; "
        f"{result['exact_rows_verified']} exact rows; "
        f"{result['chunk_hashes_verified']} chunk hashes; "
        f"{result['overview_points_verified']} overview points"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
