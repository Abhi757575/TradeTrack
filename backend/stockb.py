from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
import yfinance as yf
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field


router = APIRouter(prefix="/rankings", tags=["rankings"])


# Default universe: keep it small enough to be responsive without needing extra web scraping.
DEFAULT_UNIVERSE: List[str] = [
    "AAPL",
    "MSFT",
    "NVDA",
    "AMZN",
    "GOOGL",
    "GOOG",
    "META",
    "TSLA",
    "BRK-B",
    "JPM",
    "V",
    "MA",
    "UNH",
    "XOM",
    "LLY",
    "AVGO",
    "COST",
    "WMT",
    "PG",
    "HD",
    "KO",
    "PEP",
    "ADBE",
    "NFLX",
    "CRM",
    "INTC",
    "AMD",
    "QCOM",
    "ORCL",
    "CSCO",
    "IBM",
    "BA",
    "CAT",
    "GE",
    "NKE",
    "MCD",
    "DIS",
    "PFE",
    "JNJ",
    "MRK",
    "ABBV",
    "TMO",
    "ABT",
    "CVX",
    "BAC",
    "WFC",
    "C",
    "GS",
    "MS",
    "SPY",
    "QQQ",
]


class RankedStock(BaseModel):
    symbol: str = Field(..., description="Ticker symbol")
    return_pct: float = Field(..., description="Year-to-date return in percent")
    company_name: Optional[str] = Field(None, description="Best-effort company/ETF name")


class RankingsResponse(BaseModel):
    as_of: str
    year: int
    universe: str
    universe_size: int
    mean_return_pct: float
    top_gainers: List[RankedStock]
    most_average: List[RankedStock]
    skipped: List[Dict[str, Any]]


@dataclass(frozen=True)
class _CacheKey:
    year: int
    limit: int
    symbols: Tuple[str, ...]


_CACHE_TTL_SECONDS = 6 * 60 * 60  # 6h
_cache: Dict[_CacheKey, Tuple[float, RankingsResponse]] = {}


def _today_utc_date() -> date:
    return datetime.utcnow().date()


def _download_prices(symbols: List[str], start: date, end: date) -> pd.DataFrame:
    # yfinance expects strings; keep progress off for API usage.
    # auto_adjust=True makes "Close" adjusted, which is fine for return comparisons.
    return yf.download(
        tickers=" ".join(symbols),
        start=str(start),
        end=str(end),
        interval="1d",
        group_by="ticker",
        auto_adjust=True,
        threads=True,
        progress=False,
    )


def _safe_company_name(symbol: str) -> Optional[str]:
    # Best-effort only (avoid failing the whole response if info is unavailable/rate-limited).
    try:
        info = yf.Ticker(symbol).info
        name = info.get("longName") or info.get("shortName")
        return str(name) if name else None
    except Exception:
        return None


def _compute_ytd_returns(symbols: List[str], year: int) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    start = date(year, 1, 1)
    # yfinance end is exclusive; add a day so we include "today" if present.
    end = _today_utc_date() + timedelta(days=1)

    raw = _download_prices(symbols, start=start, end=end)
    if raw is None or raw.empty:
        return [], [{"symbol": s, "reason": "no_data"} for s in symbols]

    results: List[Dict[str, Any]] = []
    skipped: List[Dict[str, Any]] = []

    def _extract_close(df: pd.DataFrame) -> Optional[pd.Series]:
        if df is None or df.empty:
            return None
        for col in ("Close", "Adj Close"):
            if col in df.columns:
                return df[col].dropna()
        return None

    # Multi-ticker downloads produce MultiIndex columns: (ticker, field)
    is_multi = isinstance(raw.columns, pd.MultiIndex)
    if (not is_multi) and len(symbols) > 1:
        # Unexpected shape; avoid returning incorrect results.
        return [], [{"symbol": s, "reason": "unexpected_download_shape"} for s in symbols]

    for symbol in symbols:
        try:
            if is_multi:
                if symbol not in raw.columns.get_level_values(0):
                    skipped.append({"symbol": symbol, "reason": "missing_symbol"})
                    continue
                df = raw[symbol]
            else:
                df = raw

            close = _extract_close(df)
            if close is None or len(close) < 2:
                skipped.append({"symbol": symbol, "reason": "insufficient_history"})
                continue

            first = float(close.iloc[0])
            last = float(close.iloc[-1])
            if first <= 0:
                skipped.append({"symbol": symbol, "reason": "bad_first_price"})
                continue

            ret_pct = (last / first - 1.0) * 100.0
            results.append({"symbol": symbol, "return_pct": ret_pct})
        except Exception as e:
            skipped.append({"symbol": symbol, "reason": f"error: {type(e).__name__}"})

    return results, skipped


@router.get("/ytd", response_model=RankingsResponse)
def ytd_rankings(
    limit: int = Query(10, ge=1, le=50),
    symbols: Optional[str] = Query(
        None,
        description="Optional comma-separated ticker symbols. If omitted, uses a built-in universe.",
    ),
):
    year = _today_utc_date().year

    if symbols:
        universe = [s.strip().upper() for s in symbols.split(",") if s.strip()]
        if not universe:
            raise HTTPException(status_code=400, detail="symbols is empty.")
        universe_name = "custom"
    else:
        universe = DEFAULT_UNIVERSE[:]
        universe_name = "default"

    # De-dupe while preserving order.
    seen = set()
    universe = [s for s in universe if not (s in seen or seen.add(s))]

    key = _CacheKey(year=year, limit=limit, symbols=tuple(universe))
    now = time.time()
    cached = _cache.get(key)
    if cached and (now - cached[0]) < _CACHE_TTL_SECONDS:
        return cached[1]

    rows, skipped = _compute_ytd_returns(universe, year=year)
    if not rows:
        raise HTTPException(status_code=502, detail="Unable to compute YTD returns right now.")

    mean_return = float(pd.Series([r["return_pct"] for r in rows]).mean())

    top = sorted(rows, key=lambda r: r["return_pct"], reverse=True)[:limit]
    avg = sorted(rows, key=lambda r: abs(r["return_pct"] - mean_return))[:limit]

    # Attach names for just the displayed symbols (keep it fast).
    def _to_ranked(item: Dict[str, Any]) -> RankedStock:
        sym = str(item["symbol"])
        return RankedStock(
            symbol=sym,
            return_pct=round(float(item["return_pct"]), 2),
            company_name=_safe_company_name(sym),
        )

    payload = RankingsResponse(
        as_of=str(_today_utc_date()),
        year=year,
        universe=universe_name,
        universe_size=len(universe),
        mean_return_pct=round(mean_return, 2),
        top_gainers=[_to_ranked(x) for x in top],
        most_average=[_to_ranked(x) for x in avg],
        skipped=skipped,
    )

    _cache[key] = (now, payload)
    return payload
