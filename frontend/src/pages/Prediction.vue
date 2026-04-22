<script setup>
import { computed, onMounted, ref } from "vue";
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

function createEmptyFields() {
  const obj = {};
  FEATURE_KEYS.forEach((key) => {
    obj[key] = "";
  });
  return obj;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : null;
}

function formatVolume(value) {
  if (!value && value !== 0) return "--";
  const num = Number(value);
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
}

function buildFeaturePayload(fields) {
  const payload = {};
  FEATURE_KEYS.forEach((key) => {
    const parsed = parseFloat(fields[key]);
    if (Number.isNaN(parsed)) {
      throw new Error(`Please enter ${key}`);
    }
    payload[key] = parsed;
  });
  return payload;
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function createLocalPrediction({ symbol, modelId, modelName, days, fields }) {
  const close = parseNumber(fields.adjClose) ?? 0;
  const sma10 = parseNumber(fields.SMA_10) ?? close;
  const sma50 = parseNumber(fields.SMA_50) ?? close;
  const rsi = parseNumber(fields.RSI) ?? 50;
  const macdHist = parseNumber(fields.MACD_hist) ?? 0;
  const volume = parseNumber(fields.adjVolume) ?? 0;

  const trendSignal = close === 0 ? 0 : ((sma10 - sma50) / close) * 100;
  const rsiSignal = (50 - rsi) / 100;
  const macdSignal = macdHist / Math.max(close * 0.01, 1);
  const volumeSignal = volume > 0 ? Math.min(volume / 1e8, 2) : 0;
  const composite = trendSignal * 0.45 + rsiSignal * 2.2 + macdSignal * 0.8 + volumeSignal;

  const baseMovePct = clamp(composite * 0.3, -2.5, 2.5);
  const perDayMove = (baseMovePct / 100) * Math.max(close, 1);

  const predictions = [];
  let price = close || 100;
  for (let i = 0; i < days; i += 1) {
    price += perDayMove * (0.85 + i * 0.05);
    const spread = Math.max(price * 0.012, 0.5);
    predictions.push({
      date: `T+${i + 1}`,
      price: Number(price.toFixed(2)),
      lower: Number((price - spread).toFixed(2)),
      upper: Number((price + spread).toFixed(2)),
    });
  }

  const confidence = clamp(0.55 + Math.abs(composite) * 0.05, 0.45, 0.92);
  return {
    symbol,
    model: modelName || modelId || "Model",
    confidence,
    predictions,
    accuracy_history: [],
    metrics: {},
  };
}

const tickerInput = ref("AAPL");
const currentTicker = ref("");
const stockInfo = ref(null);
const fields = ref(createEmptyFields());
const modelList = ref(FALLBACK_MODELS);
const model = ref("lstm");
const predictionDays = ref(5);

const loadingFetch = ref(false);
const loadingPredict = ref(false);
const searchInfo = ref("");
const searchError = ref("");
const predictionResult = ref(null);
const predictionError = ref("");

function handleFieldChange(key, value) {
  fields.value = { ...fields.value, [key]: value };
}

function populateFields(data) {
  const next = {};
  FEATURE_KEYS.forEach((key) => {
    const value = data[key];
    next[key] = value !== undefined && value !== null ? String(value) : "";
  });
  fields.value = next;
}

async function loadModels() {
  try {
    const response = await fetch(`${API_BASE}/models`);
    if (!response.ok) throw new Error("Unable to load models");
    const json = await response.json();
    const models = json.models?.length ? json.models : FALLBACK_MODELS;
    modelList.value = models;
    if (!models.some((item) => item.id === model.value)) model.value = models[0].id;
  } catch {
    modelList.value = FALLBACK_MODELS;
    if (!FALLBACK_MODELS.some((item) => item.id === model.value)) model.value = FALLBACK_MODELS[0].id;
  }
}

async function fetchStock() {
  const symbol = tickerInput.value.trim().toUpperCase();
  if (!symbol) {
    searchError.value = "Please enter a ticker symbol.";
    return;
  }

  loadingFetch.value = true;
  searchError.value = "";
  predictionResult.value = null;
  predictionError.value = "";
  searchInfo.value = `Fetching data for ${symbol}...`;

  try {
    const response = await fetch(`${API_BASE}/features/${symbol}`);
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || "Unable to fetch data for ticker");
    }

    const data = await response.json();
    stockInfo.value = data;
    currentTicker.value = data.symbol;
    tickerInput.value = data.symbol;
    populateFields(data);
    searchInfo.value = `Data refreshed for ${data.symbol}`;
  } catch (error) {
    const fallback = FALLBACK_FEATURE_DATA[symbol];
    if (fallback) {
      stockInfo.value = fallback;
      currentTicker.value = fallback.symbol;
      tickerInput.value = fallback.symbol;
      populateFields(fallback);
      searchError.value = "";
      searchInfo.value = `Live API is unavailable, so showing saved demo data for ${fallback.symbol}.`;
    } else {
      stockInfo.value = null;
      searchError.value = error.message || "Failed to fetch stock features";
      searchInfo.value = "";
      fields.value = createEmptyFields();
      currentTicker.value = "";
    }
  } finally {
    loadingFetch.value = false;
  }
}

async function predict() {
  if (!currentTicker.value) {
    predictionError.value = "Fetch stock data before running a prediction.";
    return;
  }

  let payload;
  try {
    payload = buildFeaturePayload(fields.value);
  } catch (error) {
    predictionError.value = error.message || "Please fill all fields.";
    return;
  }

  loadingPredict.value = true;
  predictionResult.value = null;
  predictionError.value = "";

  try {
    const response = await fetch(
      `${API_BASE}/predict/${currentTicker.value}?days=${predictionDays.value}&model_id=${model.value}`,
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

    predictionResult.value = await response.json();
  } catch {
    predictionResult.value = createLocalPrediction({
      symbol: currentTicker.value,
      modelId: model.value,
      modelName: modelList.value.find((item) => item.id === model.value)?.name || "Selected Model",
      days: predictionDays.value,
      fields: fields.value,
    });
    predictionError.value = "Live prediction API is unavailable, so a local estimate is being shown.";
  } finally {
    loadingPredict.value = false;
  }
}

onMounted(() => {
  loadModels();
});

const predictedPrice = computed(() => predictionResult.value?.predictions?.[0]?.price ?? null);
const baselineClose = computed(() => parseNumber(fields.value.adjClose));
const priceDelta = computed(() => {
  if (predictedPrice.value === null || baselineClose.value === null) return null;
  return predictedPrice.value - baselineClose.value;
});
const pctDelta = computed(() => {
  if (priceDelta.value === null || baselineClose.value === null) return null;
  return (priceDelta.value / baselineClose.value) * 100;
});
const deltaUp = computed(() => priceDelta.value !== null && priceDelta.value >= 0);

const rsiValue = computed(() => parseNumber(fields.value.RSI));
const macdHist = computed(() => parseNumber(fields.value.MACD_hist));
const sma10Value = computed(() => parseNumber(fields.value.SMA_10));
const sma50Value = computed(() => parseNumber(fields.value.SMA_50));

const rsiSignal = computed(() => {
  if (rsiValue.value === null) return "Neutral";
  if (rsiValue.value > 70) return "Overbought (bearish)";
  if (rsiValue.value < 30) return "Oversold (bullish)";
  return "Neutral";
});

const macdSignal = computed(() => {
  if (macdHist.value === null) return "Neutral";
  return macdHist.value > 0 ? "Bullish" : "Bearish";
});

const smaTrend = computed(() => {
  if (sma10Value.value === null || sma50Value.value === null) return "Waiting";
  return sma10Value.value > sma50Value.value ? "Golden Cross" : "Death Cross";
});

const forecastName = computed(() => {
  return (
    predictionResult.value?.model ||
    modelList.value.find((item) => item.id === model.value)?.name ||
    "Model"
  );
});

const forecastConfidence = computed(() => {
  const conf = predictionResult.value?.confidence;
  return conf !== undefined ? `${(conf * 100).toFixed(1)}%` : "--";
});
</script>

<template>
  <section class="prediction-shell">
    <div class="container">
      <div class="header">
        <div class="badge">ML - 6 MODELS</div>
        <h1>Stock <span>Price Predictor</span></h1>
        <p class="subtitle">
          Search any ticker, auto-populate feature inputs, and predict the next trading day close.
        </p>
      </div>

      <div class="search-section">
        <div class="section-label">Search Stock</div>
        <div class="search-row">
          <div class="search-wrap">
            <span class="search-icon">?</span>
            <input
              id="tickerInput"
              v-model="tickerInput"
              type="text"
              placeholder="Enter ticker symbol e.g. AAPL, TSLA, MSFT..."
              @keydown.enter="fetchStock"
            />
          </div>
          <button class="search-btn" id="searchBtn" type="button" @click="fetchStock" :disabled="loadingFetch">
            <span v-if="loadingFetch" class="spinner" />
            <span v-else>Fetch</span>
          </button>
        </div>

        <div class="msg info" :class="searchInfo ? 'visible' : ''" id="searchInfo">{{ searchInfo }}</div>
        <div class="msg error" :class="searchError ? 'visible' : ''" id="searchErr">{{ searchError }}</div>
      </div>

      <div class="stock-header-card" :class="stockInfo ? 'visible' : ''" id="stockHeader">
        <div class="stock-header-top">
          <div class="stock-name-row">
            <div class="stock-logo">{{ stockInfo?.symbol ? stockInfo.symbol.slice(0, 1) : "--" }}</div>
            <div>
              <div class="stock-title" id="stockTicker">{{ stockInfo?.symbol || "--" }}</div>
              <div class="stock-company" id="stockName">{{ stockInfo?.company_name || "" }}</div>
            </div>
          </div>

          <div class="price-display">
            <div class="price-big">{{ stockInfo ? `$${Number(stockInfo.adjClose).toFixed(2)}` : "-" }}</div>
            <div
              :class="`price-change ${stockInfo && stockInfo.change_pct >= 0 ? 'up' : 'down'}`"
            >
              {{ stockInfo ? `${stockInfo.change_pct >= 0 ? '+' : ''}${stockInfo.change_pct.toFixed(2)}%` : "--" }}
            </div>
          </div>
        </div>

        <div class="stock-stats">
          <div class="stat-item">
            <div class="stat-label">Close</div>
            <div class="stat-value">{{ stockInfo ? `$${Number(stockInfo.adjClose).toFixed(2)}` : "-" }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">High</div>
            <div class="stat-value">{{ stockInfo ? `$${Number(stockInfo.adjHigh).toFixed(2)}` : "-" }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Low</div>
            <div class="stat-value">{{ stockInfo ? `$${Number(stockInfo.adjLow).toFixed(2)}` : "-" }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Volume</div>
            <div class="stat-value">{{ stockInfo ? formatVolume(stockInfo.adjVolume) : "-" }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">RSI</div>
            <div class="stat-value">{{ stockInfo?.RSI ? stockInfo.RSI.toFixed(1) : "-" }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">MACD</div>
            <div class="stat-value">{{ stockInfo?.MACD ? stockInfo.MACD.toFixed(4) : "-" }}</div>
          </div>
        </div>
      </div>

      <div class="fields-section" :class="stockInfo ? 'visible' : ''" id="fieldsSection">
        <div class="section-label">Price &amp; Volume</div>
        <div class="legend">
          <span><span class="dot dot-b" /> Price</span>
          <span><span class="dot dot-r" /> Volume</span>
          <span><span class="dot dot-g" /> Indicators</span>
        </div>
        <div class="input-grid">
          <div v-for="field in PRICE_FIELDS" :key="field.key" :class="`input-group ${field.className}`">
            <label>
              <span :class="`dot ${field.className === 'cat-vol' ? 'dot-r' : 'dot-b'}`" />
              {{ field.label }}
            </label>
            <input
              type="number"
              :step="field.key === 'adjVolume' ? '1' : '0.01'"
              :value="fields[field.key]"
              placeholder="0.00"
              @input="handleFieldChange(field.key, $event.target.value)"
            />
            <div class="hint">{{ field.hint }}</div>
          </div>
        </div>

        <div class="section-label">Technical Indicators</div>
        <div class="input-grid">
          <div v-for="field in INDICATOR_FIELDS" :key="field.key" class="input-group">
            <label><span class="dot dot-g" />{{ field.label }}</label>
            <input
              type="number"
              :step="field.key === 'RSI' ? '0.01' : '0.0001'"
              :value="fields[field.key]"
              placeholder="0.00"
              @input="handleFieldChange(field.key, $event.target.value)"
            />
            <div class="hint">{{ field.hint }}</div>
          </div>
        </div>

        <div class="model-row">
          <label>Model →</label>
          <select v-model="model">
            <option v-for="item in modelList" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </div>

        <label class="horizon-control">
          Prediction horizon: <strong>{{ predictionDays }} days</strong>
          <input type="range" min="1" max="30" :value="predictionDays" @input="predictionDays = Number($event.target.value)" />
        </label>

        <button class="predict-btn" id="predictBtn" type="button" @click="predict" :disabled="loadingPredict || !stockInfo">
          <template v-if="loadingPredict">
            <span class="spinner spinner-light" /> Predicting...
          </template>
          <template v-else>Predict Next Day Close -></template>
        </button>

        <div v-if="predictionError" class="msg error visible" id="predictErr">{{ predictionError }}</div>

        <div class="result-card" :class="predictionResult ? 'visible' : ''" id="resultCard">
          <div class="result-label">
            Predicted next-day adj close - {{ forecastName }} -
            <span id="resultTicker">{{ currentTicker || "-" }}</span>
          </div>
          <div>
            <span class="result-price" id="resultPrice">
              {{ predictedPrice ? `$${predictedPrice.toFixed(2)}` : "-" }}
            </span>
            <span :class="`change-badge ${deltaUp ? 'cbadge-up' : 'cbadge-down'}`" id="changeBadge">
              {{ priceDelta !== null ? `${deltaUp ? '+ ' : '- '}${(pctDelta ?? 0).toFixed(2)}%` : "--" }}
            </span>
          </div>

          <div class="result-meta">
            <div class="rm-item">
              <div class="rm-label">Current Close</div>
              <div class="rm-value" id="metaCurrent">
                {{ baselineClose !== null ? `$${baselineClose.toFixed(2)}` : "--" }}
              </div>
            </div>
            <div class="rm-item">
              <div class="rm-label">Change ($)</div>
              <div class="rm-value" id="metaDelta">
                {{ priceDelta !== null ? `${priceDelta >= 0 ? '+' : ''}${priceDelta.toFixed(2)}` : "--" }}
              </div>
            </div>
            <div class="rm-item">
              <div class="rm-label">RSI Signal</div>
              <div class="rm-value" id="metaRSI">{{ rsiSignal }}</div>
            </div>
            <div class="rm-item">
              <div class="rm-label">MACD Signal</div>
              <div class="rm-value" id="metaMACD">{{ macdSignal }}</div>
            </div>
            <div class="rm-item">
              <div class="rm-label">SMA Trend</div>
              <div class="rm-value" id="metaSMA">{{ smaTrend }}</div>
            </div>
          </div>

          <div class="panel-graph">
            <div class="graph-heading">
              <div>
                <p class="eyebrow">Confidence</p>
                <strong>{{ forecastConfidence }}</strong>
              </div>
              <span>{{ predictionDays }}-day horizon</span>
            </div>
            <p class="forecast-note">
              Higher confidence tends to match smoother markets; treat every prediction as illustrative and double-check with independent data.
            </p>
            <div class="graph-meta">
              <span>{{ forecastName }}</span>
              <span>{{ currentTicker || "--" }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="disclaimer">
        <strong>Disclaimer:</strong> Models were trained on historical AAPL data. Predictions for other tickers should be interpreted as illustrative unless the models are retrained.
      </div>
    </div>
  </section>
</template>
