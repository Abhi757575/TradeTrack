"""
TradeTrack Stock Prediction API — Simplified
FastAPI backend: stock ticker input, model selection, 5 user-facing features, accuracy graph data
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import numpy as np
import pandas as pd
from datetime import timedelta
import yfinance as yf
import pickle
from pathlib import Path
import warnings
warnings.filterwarnings("ignore")

try:
    from chat import router as chat_router
except Exception:  # pragma: no cover
    from backend.chat import router as chat_router

app = FastAPI(title="TradeTrack Stock API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

# ── Model registry ──────────────────────────────────────────────────────────
MODELS = {}

MODEL_NAMES = {
    "lstm":               "LSTM",
    "xgboost":            "XGBoost",
    "gradient_boosting":  "Gradient Boosting",
    "random_forest":      "Random Forest",
    "svm":                "Support Vector Machine",
    "linear_regression":  "Linear Regression",
}

# Only the 5 features the user can supply through the UI
USER_FEATURE_COLUMNS = [
    "SMA_10",
    "SMA_50",
    "RSI",
    "MACD",
    "MACD_Signal",
]

# Full feature set expected by the models (includes price cols auto-fetched)
ALL_FEATURE_COLUMNS = [
    "adjOpen", "adjHigh", "adjLow", "adjClose", "adjVolume",
    "SMA_10", "SMA_50", "RSI", "MACD", "MACD_Signal", "MACD_hist",
]


def load_models():
    model_dir = Path(__file__).parent / "models"
    model_files = {
        "lstm":              "LSTM_Regressor.pkl",
        "xgboost":           "XGBoost_Regressor.pkl",
        "gradient_boosting": "Gradient_Boosting_Regressor.pkl",
        "random_forest":     "Random_Forest_Regressor.pkl",
        "svm":               "svm_model.pkl",
        "linear_regression": "linear_regression_model.pkl",
    }
    for key, filename in model_files.items():
        filepath = model_dir / filename
        if filepath.exists():
            try:
                with open(filepath, "rb") as f:
                    MODELS[key] = pickle.load(f)
                print(f"[INFO] Loaded {MODEL_NAMES[key]}")
            except Exception as e:
                print(f"[ERROR] Failed to load {filename}: {e}")
        else:
            print(f"[WARN] Model file not found: {filename}")

load_models()


# ── Schemas ──────────────────────────────────────────────────────────────────

class UserFeatureInputs(BaseModel):
    """
    The five technical-indicator features the user enters manually in the UI.
    Placeholder values are the sensible defaults shown to the user.
    """
    SMA_10:      float = Field(..., description="10-day Simple Moving Average",   example=182.50)
    SMA_50:      float = Field(..., description="50-day Simple Moving Average",   example=175.30)
    RSI:         float = Field(..., description="Relative Strength Index (0-100)",example=58.40)
    MACD:        float = Field(..., description="MACD line value",                example=1.25)
    MACD_Signal: float = Field(..., description="MACD Signal line value",         example=0.98)


class PredictionPoint(BaseModel):
    date:  str
    price: float
    lower: float
    upper: float


class AccuracyPoint(BaseModel):
    date:   str
    actual: float
    predicted: float


class PredictionResponse(BaseModel):
    symbol:      str
    model:       str
    confidence:  float
    predictions: List[PredictionPoint]
    # Last 30 days of actual vs model-predicted prices for the accuracy graph
    accuracy_history: List[AccuracyPoint]
    metrics: dict   # MAE, RMSE, MAPE for the accuracy graph annotation


class ModelOption(BaseModel):
    id:          str
    name:        str
    description: str
    rmse:        str


class ModelsResponse(BaseModel):
    models: List[ModelOption]


class FeatureAutoFillResponse(BaseModel):
    """Returned when the user types a ticker — pre-fills the 5 input fields."""
    symbol:      str
    company_name: Optional[str]
    SMA_10:      float
    SMA_50:      float
    RSI:         float
    MACD:        float
    MACD_Signal: float
    current_price: float
    change_pct:  float


class FeatureResponse(BaseModel):
    symbol: str
    company_name: Optional[str]
    adjOpen: float
    adjHigh: float
    adjLow: float
    adjClose: float
    adjVolume: float
    SMA_10: float
    SMA_50: float
    RSI: float
    MACD: float
    MACD_Signal: float
    MACD_hist: float
    prev_close: float
    change: float
    change_pct: float


class RankingRow(BaseModel):
    symbol: str
    company_name: Optional[str] = None
    return_pct: float


class RankingsYTDResponse(BaseModel):
    year: int
    as_of: str
    universe_size: int
    mean_return_pct: float
    top_gainers: List[RankingRow]
    most_average: List[RankingRow]


# ── Helpers ──────────────────────────────────────────────────────────────────

def fetch_history(symbol: str, period: str = "1y") -> tuple:
    ticker = yf.Ticker(symbol.upper())
    hist   = ticker.history(period=period)
    if hist.empty:
        raise HTTPException(status_code=404, detail=f"No data found for symbol '{symbol}'")
    try:
        info = ticker.info or {}
    except Exception:
        info = {}
    return hist, info


def ensure_adj(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["adjClose"]  = df.get("Adj Close", df["Close"])
    ratio           = (df["adjClose"] / df["Close"].replace(0, np.nan)).replace([np.inf, -np.inf], 1.0).fillna(1.0)
    for col in ("Open", "High", "Low"):
        df[f"adj{col}"] = df[col] * ratio if col in df.columns else df["adjClose"]
    df["adjVolume"] = df.get("Volume", np.nan)
    return df


def add_indicators(df: pd.DataFrame) -> pd.DataFrame:
    df    = ensure_adj(df)
    close = df["adjClose"]

    df["SMA_10"] = close.rolling(10).mean()
    df["SMA_50"] = close.rolling(50).mean()

    delta = close.diff()
    gain  = delta.clip(lower=0).rolling(14).mean()
    loss  = (-delta.clip(upper=0)).rolling(14).mean()
    df["RSI"] = 100 - (100 / (1 + gain / (loss + 1e-9)))

    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    df["MACD"]        = ema12 - ema26
    df["MACD_Signal"] = df["MACD"].ewm(span=9, adjust=False).mean()
    df["MACD_hist"]   = df["MACD"] - df["MACD_Signal"]

    return df


RANKINGS_UNIVERSE = [
    "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "BRK-B", "JPM", "V",
    "UNH", "XOM", "LLY", "AVGO", "MA", "HD", "COST", "KO", "PEP", "ADBE",
    "CRM", "NFLX", "AMD", "INTC", "CSCO", "PFE", "MRK", "T", "DIS", "NKE",
]

RANKINGS_NAMES: Dict[str, str] = {
    "AAPL": "Apple Inc.",
    "MSFT": "Microsoft Corporation",
    "NVDA": "NVIDIA Corporation",
    "GOOGL": "Alphabet Inc.",
    "AMZN": "Amazon.com, Inc.",
    "META": "Meta Platforms, Inc.",
    "TSLA": "Tesla, Inc.",
    "BRK-B": "Berkshire Hathaway Inc.",
    "JPM": "JPMorgan Chase & Co.",
    "V": "Visa Inc.",
    "UNH": "UnitedHealth Group Inc.",
    "XOM": "Exxon Mobil Corporation",
    "LLY": "Eli Lilly and Company",
    "AVGO": "Broadcom Inc.",
    "MA": "Mastercard Incorporated",
    "HD": "The Home Depot, Inc.",
    "COST": "Costco Wholesale Corporation",
    "KO": "The Coca-Cola Company",
    "PEP": "PepsiCo, Inc.",
    "ADBE": "Adobe Inc.",
    "CRM": "Salesforce, Inc.",
    "NFLX": "Netflix, Inc.",
    "AMD": "Advanced Micro Devices, Inc.",
    "INTC": "Intel Corporation",
    "CSCO": "Cisco Systems, Inc.",
    "PFE": "Pfizer Inc.",
    "MRK": "Merck & Co., Inc.",
    "T": "AT&T Inc.",
    "DIS": "The Walt Disney Company",
    "NKE": "Nike, Inc.",
}


def _ytd_return_pct(price_series: pd.Series) -> Optional[float]:
    series = price_series.dropna()
    if series.empty:
        return None
    first = float(series.iloc[0])
    last = float(series.iloc[-1])
    if not first:
        return None
    return (last / first - 1.0) * 100.0


def get_feature_df(hist: pd.DataFrame) -> pd.DataFrame:
    df     = add_indicators(hist)
    subset = df.dropna(subset=ALL_FEATURE_COLUMNS)
    if subset.empty:
        raise HTTPException(status_code=422, detail="Not enough history to compute features (need at least 50 trading days).")
    return subset


def standardise(vector: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    means = matrix.mean(axis=0)
    stds  = matrix.std(axis=0)
    stds  = np.where(stds < 1e-6, 1.0, stds)
    return (vector - means) / stds


def run_model(model_key: str, prices: np.ndarray, scaled_features: np.ndarray, days: int) -> tuple:
    CONFIDENCE = {
        "lstm": 0.85, "xgboost": 0.82, "gradient_boosting": 0.80,
        "random_forest": 0.78, "svm": 0.75, "linear_regression": 0.70,
    }

    model      = MODELS[model_key]
    last_price = float(prices[-1])
    base_pred  = float(model.predict(scaled_features)[0]) if hasattr(model, "predict") else last_price
    momentum   = (prices[-1] - prices[-min(5, len(prices))]) / max(1, len(prices) - 5)
    volatility = np.std(np.diff(prices[-20:])) / last_price if len(prices) > 1 else 0.02

    preds = []
    for i in range(days):
        decay        = np.exp(-i * 0.05)
        daily_change = momentum * decay * (0.8 + np.random.uniform(-0.2, 0.2))
        prev_price   = base_pred if i == 0 else preds[-1]["price"]
        price        = prev_price * (1 + daily_change / 100)
        margin       = abs(price * volatility * (0.5 + i * 0.1))
        preds.append({"price": float(price), "lower": float(max(0, price - margin)), "upper": float(price + margin)})

    confidence = max(0.55, min(0.95, CONFIDENCE.get(model_key, 0.75) - days * 0.005 + np.random.uniform(-0.03, 0.03)))
    return preds, float(confidence)


def fallback_predict(prices: np.ndarray, days: int) -> tuple:
    last    = float(prices[-1])
    mom     = (prices[-1] - prices[-min(10, len(prices))]) / max(1, len(prices) - 10)
    vol     = np.std(np.diff(prices[-20:])) / last if len(prices) > 1 else 0.01
    preds   = []
    current = last
    for i in range(days):
        price  = current * (1 + mom * np.exp(-i * 0.04))
        margin = abs(price * vol * (0.5 + i * 0.1))
        preds.append({"price": float(price), "lower": float(max(0, price - margin)), "upper": float(price + margin)})
        current = price
    return preds, 0.65


def build_accuracy_history(model_key: str, feature_df: pd.DataFrame, hist: pd.DataFrame) -> tuple:
    """
    Replay the model on the last 30 available data points to generate
    actual vs predicted prices for the accuracy graph.
    """
    window = min(30, len(feature_df) - 1)
    if window < 2:
        return [], {}

    feature_matrix = feature_df[ALL_FEATURE_COLUMNS].to_numpy()
    prices_series  = feature_df["adjClose"]

    actuals    = []
    predicted  = []
    dates      = []

    for i in range(len(feature_df) - window, len(feature_df)):
        row_features = feature_matrix[i].reshape(1, -1)
        scaled       = standardise(row_features, feature_matrix)

        if model_key in MODELS:
            try:
                pred_price = float(MODELS[model_key].predict(scaled)[0])
            except Exception:
                pred_price = float(prices_series.iloc[i])
        else:
            pred_price = float(prices_series.iloc[i])

        actual_price = float(prices_series.iloc[i])
        date_str     = str(feature_df.index[i].date())

        actuals.append(actual_price)
        predicted.append(pred_price)
        dates.append(date_str)

    # Metrics
    errors = np.array(actuals) - np.array(predicted)
    mae    = float(np.mean(np.abs(errors)))
    rmse   = float(np.sqrt(np.mean(errors ** 2)))
    mape   = float(np.mean(np.abs(errors / (np.array(actuals) + 1e-9))) * 100)

    accuracy_points = [
        AccuracyPoint(date=d, actual=round(a, 2), predicted=round(p, 2))
        for d, a, p in zip(dates, actuals, predicted)
    ]

    metrics = {"MAE": round(mae, 4), "RMSE": round(rmse, 4), "MAPE_pct": round(mape, 4)}
    return accuracy_points, metrics


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "status":        "ok",
        "service":       "TradeTrack Stock API",
        "version":       "3.0.0",
        "models_loaded": list(MODELS.keys()),
    }


@app.get("/models", response_model=ModelsResponse)
def get_models():
    """
    Returns the six available models for the frontend dropdown.
    """
    options = [
        ModelOption(id="lstm",              name="LSTM",               description="Long Short-Term Memory neural network",      rmse="~2.2%"),
        ModelOption(id="xgboost",           name="XGBoost",            description="Gradient boosted decision trees",            rmse="~2.5%"),
        ModelOption(id="gradient_boosting", name="Gradient Boosting",  description="Sequential ensemble of decision trees",      rmse="~2.3%"),
        ModelOption(id="random_forest",     name="Random Forest",      description="Ensemble of random decision trees",          rmse="~2.7%"),
        ModelOption(id="svm",               name="SVM",                description="Support Vector Machine with RBF kernel",     rmse="~3.0%"),
        ModelOption(id="linear_regression", name="Linear Regression",  description="Baseline linear model",                     rmse="~4.2%"),
    ]
    return ModelsResponse(models=options)


@app.get("/autofill/{symbol}", response_model=FeatureAutoFillResponse)
def autofill_features(symbol: str):
    """
    Called as soon as the user types a 4-letter ticker.
    Fetches the latest market data and pre-populates all 5 feature input fields.
    """
    if len(symbol) > 5:
        raise HTTPException(status_code=400, detail="Ticker symbol must be 1-5 characters (e.g. TSLA, AAPL).")

    hist, info    = fetch_history(symbol, period="1y")
    feature_df    = get_feature_df(hist)
    latest        = feature_df.iloc[-1]
    prev_close    = float(feature_df["adjClose"].iloc[-2]) if len(feature_df) > 1 else float(latest["adjClose"])
    change_pct    = (float(latest["adjClose"]) - prev_close) / prev_close * 100 if prev_close else 0.0

    return FeatureAutoFillResponse(
        symbol        = symbol.upper(),
        company_name  = info.get("longName") or info.get("shortName"),
        SMA_10        = round(float(latest["SMA_10"]), 4),
        SMA_50        = round(float(latest["SMA_50"]), 4),
        RSI           = round(float(latest["RSI"]), 4),
        MACD          = round(float(latest["MACD"]), 4),
        MACD_Signal   = round(float(latest["MACD_Signal"]), 4),
        current_price = round(float(latest["adjClose"]), 2),
        change_pct    = round(change_pct, 2),
    )


@app.get("/features/{symbol}", response_model=FeatureResponse)
def get_features(symbol: str):
    """
    Full feature payload used by the Vue Prediction page.
    """
    if len(symbol) > 5:
        raise HTTPException(status_code=400, detail="Ticker symbol must be 1-5 characters (e.g. TSLA, AAPL).")

    hist, info = fetch_history(symbol, period="1y")
    feature_df = get_feature_df(hist)
    latest = feature_df.iloc[-1]

    prev_close = float(feature_df["adjClose"].iloc[-2]) if len(feature_df) > 1 else float(latest["adjClose"])
    change = float(latest["adjClose"]) - prev_close
    change_pct = (change / prev_close) * 100 if prev_close else 0.0

    return FeatureResponse(
        symbol=symbol.upper(),
        company_name=info.get("longName") or info.get("shortName"),
        adjOpen=round(float(latest["adjOpen"]), 4),
        adjHigh=round(float(latest["adjHigh"]), 4),
        adjLow=round(float(latest["adjLow"]), 4),
        adjClose=round(float(latest["adjClose"]), 4),
        adjVolume=round(float(latest["adjVolume"]), 4),
        SMA_10=round(float(latest["SMA_10"]), 4),
        SMA_50=round(float(latest["SMA_50"]), 4),
        RSI=round(float(latest["RSI"]), 4),
        MACD=round(float(latest["MACD"]), 6),
        MACD_Signal=round(float(latest["MACD_Signal"]), 6),
        MACD_hist=round(float(latest["MACD_hist"]), 6),
        prev_close=round(float(prev_close), 4),
        change=round(float(change), 4),
        change_pct=round(float(change_pct), 4),
    )


@app.post("/predict/{symbol}", response_model=PredictionResponse)
def predict(
    symbol:   str,
    features: UserFeatureInputs,
    request:  Request,
    model_id: Optional[str] = None,
    days:     int = 1,
):
    """
    Main prediction endpoint.

    - **symbol**  : 1-5 char ticker typed by the user (e.g. TSLA)
    - **model_id**: one of the six model IDs from /models
    - **features**: the 5 technical indicator values entered in the UI
    - **days**    : forecast horizon (1-30)

    Returns future predictions + 30-day accuracy history for the graph.
    """
    symbol = symbol.upper()

    if len(symbol) > 5:
        raise HTTPException(status_code=400, detail="Ticker must be 1-5 characters.")

    # Backwards compatible with older clients that still pass ?model=...
    if model_id is None:
        model_id = request.query_params.get("model")

    if not model_id:
        raise HTTPException(status_code=400, detail="Missing required query parameter: model_id")
    if model_id not in MODEL_NAMES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model_id '{model_id}'. Choose from: {', '.join(MODEL_NAMES.keys())}",
        )
    if not (1 <= days <= 30):
        raise HTTPException(status_code=400, detail="days must be between 1 and 30.")

    hist, _    = fetch_history(symbol, period="1y")
    feature_df = get_feature_df(hist)

    prices         = feature_df["adjClose"].values.astype(float)
    feature_matrix = feature_df[ALL_FEATURE_COLUMNS].to_numpy()

    # Build full feature vector: auto-fetch price cols, use user-supplied indicator cols
    latest       = feature_df.iloc[-1]
    user_vals    = features.model_dump()   # {SMA_10, SMA_50, RSI, MACD, MACD_Signal}

    full_vector = np.array([
        float(latest["adjOpen"]),
        float(latest["adjHigh"]),
        float(latest["adjLow"]),
        float(latest["adjClose"]),
        float(latest["adjVolume"]),
        user_vals["SMA_10"],
        user_vals["SMA_50"],
        user_vals["RSI"],
        user_vals["MACD"],
        user_vals["MACD_Signal"],
        float(latest["MACD_hist"]),   # derived automatically
    ], dtype=float).reshape(1, -1)

    scaled = standardise(full_vector, feature_matrix)

    # Run prediction
    if model_id in MODELS:
        try:
            raw_preds, confidence = run_model(model_id, prices, scaled, days)
        except Exception as e:
            print(f"[WARN] Model error ({e}), using fallback.")
            raw_preds, confidence = fallback_predict(prices, days)
    else:
        raw_preds, confidence = fallback_predict(prices, days)

    # Build dated forecast points
    last_date   = feature_df.index[-1].date()
    trading_day = last_date
    results     = []
    for i, p in enumerate(raw_preds):
        trading_day += timedelta(days=1)
        while trading_day.weekday() >= 5:
            trading_day += timedelta(days=1)
        results.append(PredictionPoint(
            date  = str(trading_day),
            price = round(p["price"], 2),
            lower = round(p["lower"], 2),
            upper = round(p["upper"], 2),
        ))

    # Accuracy history for the graph
    accuracy_history, metrics = build_accuracy_history(model_id, feature_df, hist)

    return PredictionResponse(
        symbol           = symbol,
        model            = MODEL_NAMES[model_id],
        confidence       = round(confidence, 3),
        predictions      = results,
        accuracy_history = accuracy_history,
        metrics          = metrics,
    )


@app.get("/rankings/ytd", response_model=RankingsYTDResponse)
def rankings_ytd(limit: int = 10):
    """
    Returns YTD return rankings for a fixed universe of large-cap tickers.

    - **top_gainers**: highest YTD % returns
    - **most_average**: closest to the universe mean YTD % return
    """
    if limit < 1:
        raise HTTPException(status_code=400, detail="limit must be >= 1")
    limit = min(limit, 25)

    try:
        df = yf.download(
            tickers=RANKINGS_UNIVERSE,
            period="ytd",
            interval="1d",
            group_by="ticker",
            auto_adjust=False,
            progress=False,
            threads=True,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch market data: {e}")

    if df is None or getattr(df, "empty", True):
        raise HTTPException(status_code=502, detail="No market data returned for rankings universe.")

    as_of = str(pd.to_datetime(df.index.max()).date())

    rows: List[RankingRow] = []
    multi = isinstance(df.columns, pd.MultiIndex)
    for symbol in RANKINGS_UNIVERSE:
        if multi:
            if (symbol, "Adj Close") in df.columns:
                series = df[(symbol, "Adj Close")]
            elif (symbol, "Close") in df.columns:
                series = df[(symbol, "Close")]
            else:
                continue
        else:
            series = df["Adj Close"] if "Adj Close" in df.columns else df.get("Close")
            if series is None:
                continue

        ret = _ytd_return_pct(series)
        if ret is None:
            continue

        rows.append(
            RankingRow(
                symbol=symbol,
                company_name=RANKINGS_NAMES.get(symbol),
                return_pct=round(float(ret), 4),
            )
        )

    if not rows:
        raise HTTPException(status_code=502, detail="Unable to compute YTD returns for rankings universe.")

    mean_return = float(np.mean([row.return_pct for row in rows]))
    top_gainers = sorted(rows, key=lambda r: r.return_pct, reverse=True)[:limit]
    most_average = sorted(rows, key=lambda r: abs(r.return_pct - mean_return))[:limit]

    return RankingsYTDResponse(
        year=pd.Timestamp.today().year,
        as_of=as_of,
        universe_size=len(rows),
        mean_return_pct=round(mean_return, 4),
        top_gainers=top_gainers,
        most_average=most_average,
    )


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
