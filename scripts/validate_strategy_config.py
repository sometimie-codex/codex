#!/usr/bin/env python3
"""Validate the v1 altcoin futures strategy configuration.

The script intentionally uses only the Python standard library so the baseline
repository can be checked without installing dependencies.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


class ValidationError(Exception):
    """Raised when the strategy configuration violates an invariant."""


def _load_config(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValidationError("top-level JSON value must be an object")
    return data


def _require(condition: bool, message: str) -> None:
    if not condition:
        raise ValidationError(message)


def _validate_score_bands(config: dict[str, Any]) -> None:
    bands = config.get("score_bands")
    _require(isinstance(bands, list) and bands, "score_bands must be a non-empty list")

    expected_min = 0
    for band in bands:
        _require(isinstance(band, dict), "each score band must be an object")
        band_min = band.get("min")
        band_max = band.get("max")
        _require(isinstance(band_min, int), "score band min must be an integer")
        _require(isinstance(band_max, int), "score band max must be an integer")
        _require(band_min == expected_min, f"score bands must be contiguous at {expected_min}")
        _require(band_max >= band_min, "score band max must be >= min")
        expected_min = band_max + 1

    _require(expected_min == 101, "score bands must cover exactly 0 through 100")


def _validate_risk_caps(config: dict[str, Any]) -> None:
    max_loss = config.get("absolute_max_single_trade_seed_loss_pct")
    _require(isinstance(max_loss, (int, float)), "absolute max single-trade loss must be numeric")
    _require(max_loss <= 5.0, "absolute max single-trade loss must not exceed 5%")

    regimes = config.get("market_regimes", {})
    _require(isinstance(regimes, dict), "market_regimes must be an object")
    for regime_name in ("green", "yellow", "orange", "red"):
        _require(regime_name in regimes, f"missing market regime: {regime_name}")

    for regime_name, regime in regimes.items():
        _require(isinstance(regime, dict), f"regime {regime_name} must be an object")
        risk_pct = regime.get("risk_pct", {})
        _require(isinstance(risk_pct, dict), f"regime {regime_name} risk_pct must be an object")
        for key, value in risk_pct.items():
            _require(isinstance(value, (int, float)), f"{regime_name}.{key} must be numeric")
            _require(value <= max_loss, f"{regime_name}.{key} exceeds absolute risk cap")

    _require(regimes["red"].get("entry_policy") == "no_new_entries", "red mode must block new entries")
    _require(regimes["red"].get("automation") == "off", "red mode automation must be off")


def _validate_position_plan(config: dict[str, Any]) -> None:
    entries = config.get("position_plan", {}).get("entries")
    _require(isinstance(entries, list) and entries, "position_plan.entries must be a non-empty list")
    total_weight = sum(entry.get("weight_pct", 0) for entry in entries if isinstance(entry, dict))
    _require(total_weight == 100, "position entry weights must sum to 100%")


def _validate_core_strategy(config: dict[str, Any]) -> None:
    _require(config.get("execution_mode") == "long_first", "execution_mode must remain long_first")
    _require(config.get("default_leverage") == 5, "default leverage must be 5x")

    target = config.get("monthly_trade_target", {})
    _require(target.get("min") == 20, "monthly trade target min must be 20")
    _require(target.get("max") == 40, "monthly trade target max must be 40")

    entry_rules = config.get("entry_rules", {})
    a_plus_plus = entry_rules.get("long_a_plus_plus", {})
    _require("red" in a_plus_plus.get("blocked_regimes", []), "A++ long must be blocked in red mode")

    pullback = config.get("pullback_engine_v1", {}).get("score_rules", {})
    _require(pullback.get("fvg_standalone_entry_allowed") is False, "FVG standalone entry must remain disabled")


def validate(path: Path) -> None:
    config = _load_config(path)
    _validate_core_strategy(config)
    _validate_score_bands(config)
    _validate_risk_caps(config)
    _validate_position_plan(config)


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: validate_strategy_config.py <config.json>", file=sys.stderr)
        return 2

    path = Path(argv[1])
    try:
        validate(path)
    except (OSError, json.JSONDecodeError, ValidationError) as exc:
        print(f"validation failed: {exc}", file=sys.stderr)
        return 1

    print(f"validation passed: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
