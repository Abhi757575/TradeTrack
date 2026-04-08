import { useEffect, useState } from "react";
import "../styles/prediction.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const PRICE_FIELDS = [
  { key: "adjOpen", label: "Adj Open", hint: "Today's open price", className: "cat-price" },
  { key: "adjHigh", label: "Adj High", hint: "Today's high price", className: "cat-price" },
  { key: "adjLow", label: "Adj Low", hint: "Today's low price", className: "cat-price" },
  { key: "adjClose", label: "Adj Close", hint: "Today's close price", className: "cat-price" },
  { key: "adjVolume", label: "Adj Volume", hint: "Today's trading volume", className: "cat-vol" },
];

const INDICATOR_FIELDS = [
  { key: "SMA_10", label: "SMA 10", hint: "10-day moving average" },
  { key: "SMA_50", label: "SMA 50", hint: "50-day moving average" },
  { key: "RSI", label: "RSI", hint: "Range: 0 - 100" },
  { key: "MACD", label: "MACD", hint: "MACD line value" },
  { key: "MACD_Signal", label: "MACD Signal", hint: "Signal line value" },
  { key: "MACD_hist", label: "MACD Hist", hint: "MACD - Signal" },
];

const FEATURE_KEYS = [...PRICE_FIELDS, ...INDICATOR_FIELDS].map((field) => field.key);

const FALLBACK_MODELS = [
  { id: "linear_regression", name: "Linear Regression" },
  { id: "svm", name: "Support Vector Machine" },
  { id: "gradient_boosting", name: "Gradient Boosting" },
  { id: "xgboost", name: "XGBoost" },
  { id: "random_forest", name: "Random Forest" },
  { id: "lstm", name: "LSTM" },
];

const FALLBACK_FEATURE_DATA = {
  AAPL: {
    symbol: "AAPL",
    company_name: "Apple Inc.",
    adjOpen: 214.12,
    adjHigh: 216.48,
    adjLow: 212.77,
    adjClose: 215.63,
    adjVolume: 58234000,
    SMA_10: 213.94,
    SMA_50: 208.56,
    RSI: 58.42,
    MACD: 1.1842,
    MACD_Signal: 0.9421,
    MACD_hist: 0.2421,
    prev_close: 213.91,
    change: 1.72,
    change_pct: 0.8,
  },
  MSFT: {
    symbol: "MSFT",
    company_name: "Microsoft Corporation",
    adjOpen: 426.45,
    adjHigh: 429.18,
    adjLow: 423.67,
    adjClose: 427.84,
    adjVolume: 24122000,
    SMA_10: 424.92,
    SMA_50: 417.38,
    RSI: 60.13,
    MACD: 2.4168,
    MACD_Signal: 2.1021,
    MACD_hist: 0.3147,
    prev_close: 425.31,
    change: 2.53,
    change_pct: 0.59,
  },
  NVDA: {
    symbol: "NVDA",
    company_name: "NVIDIA Corporation",
    adjOpen: 118.24,
    adjHigh: 121.66,
    adjLow: 117.81,
    adjClose: 120.92,
    adjVolume: 214875000,
    SMA_10: 117.43,
    SMA_50: 110.84,
    RSI: 67.24,
    MACD: 3.2284,
    MACD_Signal: 2.9017,
    MACD_hist: 0.3267,
    prev_close: 118.57,
    change: 2.35,
    change_pct: 1.98,
  },
  TSLA: {
    symbol: "TSLA",
    company_name: "Tesla, Inc.",
    adjOpen: 171.86,
    adjHigh: 175.24,
    adjLow: 169.91,
    adjClose: 173.78,
    adjVolume: 96845000,
    SMA_10: 170.22,
    SMA_50: 176.15,
    RSI: 47.81,
    MACD: -1.1472,
    MACD_Signal: -0.9246,
    MACD_hist: -0.2226,
    prev_close: 172.44,
    change: 1.34,
    change_pct: 0.78,
  },
};

const createEmptyFields = () => {
  const obj = {};
  FEATURE_KEYS.forEach((key) => {
    obj[key] = "";
  });
  return obj;
};

const parseNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : null;
};

const formatNumber = (value, digits = 2) => {
  if (value === null || value === undefined) return "--";
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const formatVolume = (value) => {
  if (!value && value !== 0) return "--";
  const num = Number(value);
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
};

const buildFeaturePayload = (fields) => {
  const payload = {};
  FEATURE_KEYS.forEach((key) => {
    const raw = fields[key];
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) {
      throw new Error(`Please enter ${key}`);
    }
    payload[key] = parsed;
  });
  return payload;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const createLocalPrediction = ({
  symbol,
  modelId,
  modelName,
  days,
  fields,
}) => {
  const close = parseNumber(fields.adjClose) ?? 0;
  const sma10 = parseNumber(fields.SMA_10) ?? close;
  const sma50 = parseNumber(fields.SMA_50) ?? close;
  const rsi = parseNumber(fields.RSI) ?? 50;
  const macdHist = parseNumber(fields.MACD_hist) ?? 0;
  const volume = parseNumber(fields.adjVolume) ?? 0;

  const trendSignal = close === 0 ? 0 : ((sma10 - sma50) / close) * 100;
  const rsiSignal = (50 - rsi) / 100;
  const macdSignal = macdHist / Math.max(close * 0.01, 1);
  const volumeSignal = volume > 0 ? Math.log10(volume) / 100 : 0;

  const combinedSignal =
    trendSignal * 0.45 + rsiSignal * 2.2 + macdSignal * 0.8 + volumeSignal;
  const dailyMovePct = clamp(combinedSignal, -3, 3);
  const volatilityPct = clamp(Math.abs(dailyMovePct) * 0.6 + 1.2, 1, 4.5);

  const predictions = [];
  let price = close;

  for (let day = 0; day < days; day += 1) {
    const drift = dailyMovePct * Math.exp(-day * 0.12);
    price = price * (1 + drift / 100);
    const bandPct = volatilityPct * (0.8 + day * 0.08);

    predictions.push({
      date: `Day ${day + 1}`,
      price: Number(price.toFixed(2)),
      lower: Number(Math.max(0, price * (1 - bandPct / 100)).toFixed(2)),
      upper: Number((price * (1 + bandPct / 100)).toFixed(2)),
    });
  }

  return {
    symbol,
    model: `${modelName} (Local fallback)`,
    confidence: clamp(0.72 - (days - 1) * 0.015, 0.55, 0.78),
    predictions,
  };
};

function Prediction() {
  const [tickerInput, setTickerInput] = useState("AAPL");
  const [currentTicker, setCurrentTicker] = useState("");
  const [stockInfo, setStockInfo] = useState(null);
  const [fields, setFields] = useState(() => createEmptyFields());
  const [modelList, setModelList] = useState(FALLBACK_MODELS);
  const [model, setModel] = useState(FALLBACK_MODELS[0].id);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [predictionDays, setPredictionDays] = useState(5);
  const [searchInfo, setSearchInfo] = useState("");
  const [searchError, setSearchError] = useState("");
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionError, setPredictionError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadModels() {
      try {
        const response = await fetch(`${API_BASE}/models`);
        if (!response.ok) throw new Error("Unable to load models");
        const json = await response.json();
        if (!active) return;
        const models = json.models?.length ? json.models : FALLBACK_MODELS;
        setModelList(models);
        setModel((prev) =>
          models.some((item) => item.id === prev) ? prev : models[0].id
        );
      } catch (error) {
        if (!active) return;
        setModelList(FALLBACK_MODELS);
        setModel((prev) =>
          FALLBACK_MODELS.some((item) => item.id === prev)
            ? prev
            : FALLBACK_MODELS[0].id
        );
      }
    }

    loadModels();
    return () => {
      active = false;
    };
  }, []);

  const handleFieldChange = (key, value) => {
    setFields((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const populateFields = (data) => {
    const next = {};
    FEATURE_KEYS.forEach((key) => {
      const value = data[key];
      next[key] = value !== undefined && value !== null ? String(value) : "";
    });
    setFields(next);
  };

  const fetchStock = async () => {
    const symbol = tickerInput.trim().toUpperCase();
    if (!symbol) {
      setSearchError("Please enter a ticker symbol.");
      return;
    }

    setLoadingFetch(true);
    setSearchError("");
    setPredictionResult(null);
    setPredictionError("");
    setSearchInfo(`Fetching data for ${symbol}...`);

    try {
      const response = await fetch(`${API_BASE}/features/${symbol}`);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || "Unable to fetch data for ticker");
      }

      const data = await response.json();
      setStockInfo(data);
      setCurrentTicker(data.symbol);
      setTickerInput(data.symbol);
      populateFields(data);
      setSearchInfo(`Data refreshed for ${data.symbol}`);
    } catch (error) {
      const fallback = FALLBACK_FEATURE_DATA[symbol];

      if (fallback) {
        setStockInfo(fallback);
        setCurrentTicker(fallback.symbol);
        setTickerInput(fallback.symbol);
        populateFields(fallback);
        setSearchError("");
        setSearchInfo(
          `Live API is unavailable, so showing saved demo data for ${fallback.symbol}.`
        );
      } else {
        setStockInfo(null);
        setSearchError(error.message || "Failed to fetch stock features");
        setSearchInfo("");
        setFields(createEmptyFields());
        setCurrentTicker("");
      }
    } finally {
      setLoadingFetch(false);
    }
  };

  const predict = async () => {
    if (!currentTicker) {
      setPredictionError("Fetch stock data before running a prediction.");
      return;
    }

    let payload;
    try {
      payload = buildFeaturePayload(fields);
    } catch (error) {
      setPredictionError(error.message);
      return;
    }

    setLoadingPredict(true);
    setPredictionResult(null);
    setPredictionError("");

    try {
      const response = await fetch(
        `${API_BASE}/predict/${currentTicker}?days=${predictionDays}&model=${model}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || "Prediction request failed");
      }

      const data = await response.json();
      setPredictionResult(data);
    } catch (error) {
      const fallbackPrediction = createLocalPrediction({
        symbol: currentTicker,
        modelId: model,
        modelName:
          modelList.find((item) => item.id === model)?.name || "Selected Model",
        days: predictionDays,
        fields,
      });

      setPredictionResult(fallbackPrediction);
      setPredictionError(
        "Live prediction API is unavailable, so a local estimate is being shown."
      );
    } finally {
      setLoadingPredict(false);
    }
  };

  const predictedPrice = predictionResult?.predictions?.[0]?.price ?? null;
  const baselineClose = parseNumber(fields.adjClose);
  const priceDelta =
    predictedPrice !== null && baselineClose !== null
      ? predictedPrice - baselineClose
      : null;
  const pctDelta =
    predictedPrice !== null && baselineClose !== null
      ? (priceDelta / baselineClose) * 100
      : null;
  const deltaUp = priceDelta !== null && priceDelta >= 0;

  const rsiValue = parseNumber(fields.RSI);
  const macdHist = parseNumber(fields.MACD_hist);
  const sma10Value = parseNumber(fields.SMA_10);
  const sma50Value = parseNumber(fields.SMA_50);

  const rsiSignal =
    rsiValue === null
      ? "Neutral"
      : rsiValue > 70
      ? "Overbought (bearish)"
      : rsiValue < 30
      ? "Oversold (bullish)"
      : "Neutral";

  const macdSignal =
    macdHist === null ? "Neutral" : macdHist > 0 ? "Bullish" : "Bearish";

  const smaTrend =
    sma10Value === null || sma50Value === null
      ? "Waiting"
      : sma10Value > sma50Value
      ? "Golden Cross"
      : "Death Cross";

  const forecastName =
    predictionResult?.model ||
    modelList.find((item) => item.id === model)?.name ||
    "Model";
  const forecastConfidence =
    predictionResult?.confidence !== undefined
      ? `${(predictionResult.confidence * 100).toFixed(1)}%`
      : "--";

  return (
    <section className="prediction-shell">
      <div className="container">
        <div className="header">
          <div className="badge">ML - 6 MODELS</div>
          <h1>
            Stock <span>Price Predictor</span>
          </h1>
          <p className="subtitle">
            Search any ticker, auto-populate feature inputs, and predict the next
            trading day close.
          </p>
        </div>

        <div className="search-section">
          <div className="section-label">Search Stock</div>
          <div className="search-row">
            <div className="search-wrap">
              <span className="search-icon">?</span>
              <input
                type="text"
                id="tickerInput"
                placeholder="Enter ticker symbol e.g. AAPL, TSLA, MSFT..."
                value={tickerInput}
                onChange={(event) => setTickerInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    fetchStock();
                  }
                }}
              />
            </div>
            <button
              className="search-btn"
              id="searchBtn"
              type="button"
              onClick={fetchStock}
              disabled={loadingFetch}
            >
              {loadingFetch ? (
                <>
                  <span className="spinner spinner-light" /> Fetching...
                </>
              ) : (
                "Fetch Data"
              )}
            </button>
          </div>
          {searchInfo && (
            <div className="msg info visible" id="infoMsg">
              {searchInfo}
            </div>
          )}
          {searchError && (
            <div className="msg error visible" id="searchErr">
              {searchError}
            </div>
          )}
        </div>

        <div
          className={`stock-header-card ${stockInfo ? "visible" : ""}`}
          id="stockHeader"
        >
          <div className="stock-header-top">
            <div className="stock-name-row">
              <div className="stock-logo" id="logoEl">
                {currentTicker ? currentTicker.slice(0, 4) : "-"}
              </div>
              <div>
                <div className="stock-title" id="stockTitle">
                  {currentTicker || "-"}
                </div>
                <div className="stock-company" id="stockCompany">
                  {stockInfo?.company_name || "-"}
                </div>
              </div>
            </div>
            <div className="price-display">
              <div className="price-big" id="priceEl">
                {stockInfo ? `$${stockInfo.adjClose.toFixed(2)}` : "-"}
              </div>
              <div
                className={`price-change ${
                  !stockInfo ? "" : stockInfo.change >= 0 ? "up" : "down"
                }`}
                id="priceChange"
              >
                {stockInfo
                  ? `${stockInfo.change >= 0 ? "+ " : "- "}${stockInfo.change.toFixed(
                      2
                    )} (${stockInfo.change >= 0 ? "+" : ""}${stockInfo.change_pct.toFixed(2)}%)`
                  : "-"}
              </div>
            </div>
          </div>
          <div className="stock-stats">
            <div className="stat-item">
              <div className="stat-label">Open</div>
              <div className="stat-value">
                {stockInfo ? `$${Number(stockInfo.adjOpen).toFixed(2)}` : "-"}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">High</div>
              <div className="stat-value">
                {stockInfo ? `$${Number(stockInfo.adjHigh).toFixed(2)}` : "-"}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Low</div>
              <div className="stat-value">
                {stockInfo ? `$${Number(stockInfo.adjLow).toFixed(2)}` : "-"}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Volume</div>
              <div className="stat-value">
                {stockInfo ? formatVolume(stockInfo.adjVolume) : "-"}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">RSI</div>
              <div className="stat-value">
                {stockInfo?.RSI ? stockInfo.RSI.toFixed(1) : "-"}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">MACD</div>
              <div className="stat-value">
                {stockInfo?.MACD ? stockInfo.MACD.toFixed(4) : "-"}
              </div>
            </div>
          </div>
        </div>

        <div className={`fields-section ${stockInfo ? "visible" : ""}`} id="fieldsSection">
          <div className="section-label">Price & Volume</div>
          <div className="legend">
            <span>
              <span className="dot dot-b" /> Price
            </span>
            <span>
              <span className="dot dot-r" /> Volume
            </span>
            <span>
              <span className="dot dot-g" /> Indicators
            </span>
          </div>
          <div className="input-grid">
            {PRICE_FIELDS.map((field) => (
              <div key={field.key} className={`input-group ${field.className}`}>
                <label>
                  <span
                    className={`dot ${field.className === "cat-vol" ? "dot-r" : "dot-b"}`}
                  ></span>
                  {field.label}
                </label>
                <input
                  type="number"
                  step={field.key === "adjVolume" ? "1" : "0.01"}
                  value={fields[field.key]}
                  onChange={(event) =>
                    handleFieldChange(field.key, event.target.value)
                  }
                  placeholder="0.00"
                />
                <div className="hint">{field.hint}</div>
              </div>
            ))}
          </div>

          <div className="section-label">Technical Indicators</div>
          <div className="input-grid">
            {INDICATOR_FIELDS.map((field) => (
              <div key={field.key} className="input-group">
                <label>
                  <span className="dot dot-g" />
                  {field.label}
                </label>
                <input
                  type="number"
                  step={field.key === "RSI" ? "0.01" : "0.0001"}
                  value={fields[field.key]}
                  onChange={(event) =>
                    handleFieldChange(field.key, event.target.value)
                  }
                  placeholder="0.00"
                />
                <div className="hint">{field.hint}</div>
              </div>
            ))}
          </div>

          <div className="model-row">
            <label>Model →</label>
            <select value={model} onChange={(event) => setModel(event.target.value)}>
              {modelList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <label className="horizon-control">
            Prediction horizon: <strong>{predictionDays} days</strong>
            <input
              type="range"
              min="1"
              max="30"
              value={predictionDays}
              onChange={(event) => setPredictionDays(Number(event.target.value))}
            />
          </label>

          <button
            className="predict-btn"
            id="predictBtn"
            type="button"
            onClick={predict}
            disabled={loadingPredict || !stockInfo}
          >
            {loadingPredict ? (
              <>
                <span className="spinner spinner-light" /> Predicting...
              </>
            ) : (
              "Predict Next Day Close ->"
            )}
          </button>

          {predictionError && (
            <div className="msg error visible" id="predictErr">
              {predictionError}
            </div>
          )}

          <div className={`result-card ${predictionResult ? "visible" : ""}`} id="resultCard">
            <div className="result-label">
              Predicted next-day adj close - {forecastName} -{" "}
              <span id="resultTicker">{currentTicker || "-"}</span>
            </div>
            <div>
              <span className="result-price" id="resultPrice">
                {predictedPrice ? `$${predictedPrice.toFixed(2)}` : "-"}
              </span>
              <span
                className={`change-badge ${
                  deltaUp ? "cbadge-up" : "cbadge-down"
                }`}
                id="changeBadge"
              >
                {priceDelta !== null
                  ? `${deltaUp ? "+ " : "- "}${pctDelta?.toFixed(2) ?? "--"}%`
                  : "--"}
              </span>
            </div>

            <div className="result-meta">
              <div className="rm-item">
                <div className="rm-label">Current Close</div>
                <div className="rm-value" id="metaCurrent">
                  {baselineClose !== null ? `$${baselineClose.toFixed(2)}` : "--"}
                </div>
              </div>
              <div className="rm-item">
                <div className="rm-label">Change ($)</div>
                <div className="rm-value" id="metaDelta">
                  {priceDelta !== null ? `${priceDelta >= 0 ? "+" : ""}${priceDelta.toFixed(2)}` : "--"}
                </div>
              </div>
              <div className="rm-item">
                <div className="rm-label">RSI Signal</div>
                <div className="rm-value" id="metaRSI">
                  {rsiSignal}
                </div>
              </div>
              <div className="rm-item">
                <div className="rm-label">MACD Signal</div>
                <div className="rm-value" id="metaMACD">
                  {macdSignal}
                </div>
              </div>
              <div className="rm-item">
                <div className="rm-label">SMA Trend</div>
                <div className="rm-value" id="metaSMA">
                  {smaTrend}
                </div>
              </div>
            </div>

            <div className="panel-graph">
              <div className="graph-heading">
                <div>
                  <p className="eyebrow">Confidence</p>
                  <strong>{forecastConfidence}</strong>
                </div>
                <span>{predictionDays}-day horizon</span>
              </div>
              <p className="forecast-note">
                Higher confidence tends to match smoother markets; treat every prediction as illustrative and double-check with independent data.
              </p>
              <div className="graph-meta">
                <span>{forecastName}</span>
                <span>{currentTicker || "--"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="disclaimer">
          <strong>Disclaimer:</strong> Models were trained on historical AAPL data.
          Predictions for other tickers should be interpreted as illustrative
          unless the models are retrained.
        </div>
      </div>
    </section>
  );
}

export default Prediction;