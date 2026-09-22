#!/usr/bin/env python3
"""Build, verify, and catalog every conversion-verified DLP profile product."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Sequence

from build_web_observation import (
    DEFAULT_CHUNK_SIZE,
    DEFAULT_MANIFEST,
    DEFAULT_OVERVIEW_BUCKET_SIZE,
    DEFAULT_PUBLIC_ROOT,
    BuildError,
    build_product,
    read_json,
    resolve_from_repo,
)
from verify_web_observation import (
    VerificationError,
    verify,
)


FEATURED_DATASET_ID = "rss_2010_170_x43_e_dlp_500m"


def observation_slug(metadata: dict[str, Any]) -> str:
    observation = metadata["observation"]
    direction = str(observation["ring_profile_direction"]).lower()
    direction_code = {"ingress": "i", "egress": "e"}.get(direction)
    if direction_code is None:
        raise BuildError(
            "RING_PROFILE_DIRECTION cannot form a catalog slug without guessing"
        )
    product_id = str(metadata["pds_identity"]["product_id"])
    resolution_match = re.search(r"DLP_([^.]+)", product_id)
    if resolution_match is None:
        raise BuildError(f"PRODUCT_ID lacks a DLP resolution: {product_id}")
    resolution = resolution_match.group(1).lower()
    band = re.sub(r"[^a-z0-9]+", "", str(observation["band"]).lower())
    return (
        f"rev{int(observation['revolution_number']):03d}{direction_code}-"
        f"{band}{int(observation['dsn_station_number'])}-dlp-{resolution}"
    )


def catalog_entry(
    public_root: Path,
    dataset_id: str,
    build_result: dict[str, Any],
    verification_result: dict[str, Any],
) -> dict[str, Any]:
    product_directory = public_root / dataset_id
    metadata = read_json(product_directory / "metadata.json")
    overview = read_json(product_directory / "overview.json")
    observation = metadata["observation"]
    base_path = f"/data/observations/{dataset_id}"
    return {
        "slug": observation_slug(metadata),
        "dataset_id": dataset_id,
        "display_name": (
            f"Rev {int(observation['revolution_number']):03d} "
            f"{observation['ring_profile_direction'].title()} · "
            f"{observation['band']}-band · "
            f"DSN {observation['dsn_station_number']}"
        ),
        "ring_observation_id": metadata["pds_identity"]["ring_observation_id"],
        "product_id": metadata["pds_identity"]["product_id"],
        "product_type": metadata["pds_identity"]["product_type"],
        "revolution_number": observation["revolution_number"],
        "band": observation["band"],
        "dsn_station_number": observation["dsn_station_number"],
        "ring_occultation_direction": observation[
            "ring_occultation_direction"
        ],
        "ring_profile_direction": observation["ring_profile_direction"],
        "record_count": observation["record_count"],
        "record_bytes": observation["record_bytes"],
        "radial_range": observation["radial_range"],
        "principal_variables": metadata["principal_variables"],
        "base_path": base_path,
        "metadata_url": f"{base_path}/metadata.json",
        "overview_url": f"{base_path}/overview.json",
        "index_url": f"{base_path}/index.json",
        "overview": {
            "overview_type": overview["overview_type"],
            "point_count": overview["point_count"],
            "byte_length": (product_directory / "overview.json").stat().st_size,
        },
        "web_data": {
            "validation_status": verification_result["status"],
            "chunk_size_records": build_result["chunk_size_records"],
            "chunk_count": build_result["chunk_count"],
            "exact_byte_length": build_result["exact_byte_length"],
            "total_byte_length": build_result["total_byte_length"],
            "deterministic_record_comparisons": verification_result[
                "deterministic_record_comparisons"
            ],
            "chunk_hashes_verified": verification_result[
                "chunk_hashes_verified"
            ],
        },
    }


def build_catalog(
    repo_root: Path,
    manifest_path: Path,
    public_root: Path,
    chunk_size: int,
    overview_bucket_size: int,
) -> tuple[dict[str, Any], list[str]]:
    manifest = read_json(manifest_path)
    if not isinstance(manifest, list):
        raise BuildError(f"{manifest_path}: expected a JSON array")

    entries: list[dict[str, Any]] = []
    failures: list[str] = []
    for record in manifest:
        dataset_id = str(record.get("dataset_id", ""))
        try:
            build_result = build_product(
                repo_root=repo_root,
                manifest_path=manifest_path,
                public_root=public_root,
                dataset_id=dataset_id,
                chunk_size=chunk_size,
                overview_bucket_size=overview_bucket_size,
            )
            verification_result = verify(
                repo_root=repo_root,
                manifest_path=manifest_path,
                public_root=public_root,
                dataset_id=dataset_id,
            )
            entries.append(
                catalog_entry(
                    public_root,
                    dataset_id,
                    build_result,
                    verification_result,
                )
            )
        except (BuildError, VerificationError, OSError) as exc:
            failures.append(f"{dataset_id or '<missing dataset id>'}: {exc}")

    entries.sort(
        key=lambda entry: (
            int(entry["revolution_number"]),
            entry["ring_observation_id"],
        )
    )
    if not entries:
        raise BuildError("no complete DLP profile product passed integrity verification")

    radial_minimum = min(
        entry["radial_range"]["minimum"] for entry in entries
    )
    radial_maximum = max(
        entry["radial_range"]["maximum"] for entry in entries
    )
    featured_dataset_id = (
        FEATURED_DATASET_ID
        if any(
            entry["dataset_id"] == FEATURED_DATASET_ID for entry in entries
        )
        else entries[-1]["dataset_id"]
    )
    payload = {
        "schema_version": 1,
        "catalog_type": "conversion-verified complete Cassini RSS DLP profile products",
        "source_statement": (
            "Every active entry passed PDS3 label parsing, full local "
            "conversion verification, binary chunk hashing, deterministic "
            "source comparisons, and web-data integrity verification."
        ),
        "validation_status": "pass" if not failures else "partial",
        "observation_count": len(entries),
        "featured_dataset_id": featured_dataset_id,
        "catalog_radial_domain_km": {
            "minimum": radial_minimum,
            "maximum": radial_maximum,
        },
        "observations": entries,
    }
    public_root.mkdir(parents=True, exist_ok=True)
    (public_root / "catalog.json").write_text(
        json.dumps(payload, indent=2, allow_nan=False) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    return payload, failures


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Build and verify all complete PDS-manifest observations, then "
            "write the public observation catalog."
        )
    )
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
    try:
        catalog, failures = build_catalog(
            repo_root=repo_root,
            manifest_path=resolve_from_repo(str(args.manifest), repo_root),
            public_root=resolve_from_repo(str(args.public_root), repo_root),
            chunk_size=args.chunk_size,
            overview_bucket_size=args.overview_bucket_size,
        )
    except (BuildError, OSError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    for entry in catalog["observations"]:
        print(
            f"PASS: {entry['ring_observation_id']}: "
            f"{entry['record_count']} rows, "
            f"{entry['web_data']['chunk_count']} chunks"
        )
    print(
        f"Catalog: {catalog['observation_count']} conversion-verified complete "
        f"DLP profile products; featured={catalog['featured_dataset_id']}"
    )
    if failures:
        print("Excluded observations:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
