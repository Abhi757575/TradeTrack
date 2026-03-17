import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line
} from "recharts";
import "../styles/prediction.css";

// ── Constants ─────────────────────────────────────────────────
const API_BASE = "http://localhost:8000";

const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Google" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "META", name: "Meta" },
  { symbol: "JPM", name: "JPMorgan" },
];

// ── Utility Functions ─────────────────────────────────────────
const fmt = (val) => {
  if (!val && val !== 0) return "—";
  return `$${Number(val).toFixed(2)}`;
};

const fmtPct = (val) => {
  if (!val && val !== 0) return "—";
  const num = Number(val).toFixed(2);
  return num > 0 ? `+${num}%` : `${num}%`;
};

const fmtVolume = (val) => {
  if (!val) return "—";
  if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return val.toString();
};

// ── Custom Chart Tooltip ──────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <p className="tt-date">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tt-row" style={{ color: p.color }}>
          <span className="tt-name">{p.name}:</span>
          <strong className="tt-value">{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Control Panel Component ───────────────────────────────────
function ControlPanel({ 
  models, selectedModel, onModelChange,
  selectedStock, inputSymbol, onInputChange,
  days, onDaysChange, loading, onSearch, onQuickPick, onPredict
}) {
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(inputSymbol);
  };

  return (
    <div className="control-panel">
      {/* Header */}
      <div className="cp-header">
        <h3 className="cp-title">Configuration</h3>
        <p className="cp-subtitle">Customize your prediction parameters</p>
      </div>

      {/* Stock Search */}
      <div className="cp-section">
        <label className="cp-label">📊 Stock Ticker</label>
        <form className="cp-search-form" onSubmit={handleSearchSubmit}>
          <input
            className="cp-input"
            type="text"
            placeholder="e.g., AAPL, TSLA, GOOGL"
            value={inputSymbol}
            onChange={(e) => onInputChange(e.target.value.toUpperCase())}
            maxLength={5}
          />
          <button type="submit" className="cp-btn-search" disabled={loading}>
            Search
          </button>
        </form>
      </div>

      {/* Quick Pick */}
      <div className="cp-section">
        <label className="cp-label">⚡ Quick Select</label>
        <div className="cp-chips">
          {POPULAR_STOCKS.map((stock) => (
            <button
              key={stock.symbol}
              className={`cp-chip ${selectedStock?.symbol === stock.symbol ? "active" : ""}`}
              onClick={() => onQuickPick(stock.symbol)}
              disabled={loading}
            >
              <span className="chip-sym">{stock.symbol}</span>
              <span className="chip-name">{stock.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Days */}
      <div className="cp-section">
        <div className="cp-label-row">
          <label className="cp-label">📅 Forecast Days</label>
          <span className="cp-value">{days} days</span>
        </div>
        <input
          type="range"
          className="cp-slider"
          min={1}
          max={30}
          value={days}
          onChange={(e) => onDaysChange(+e.target.value)}
          disabled={loading}
        />
        <div className="cp-range-labels">
          <span>1 day</span>
          <span>30 days</span>
        </div>
      </div>

      {/* Model Selection */}
      <div className="cp-section">
        <label className="cp-label">🤖 Select Model</label>
        <div className="cp-models">
          {models.map((m) => (
            <div
              key={m.id}
              className={`cp-model ${selectedModel === m.id ? "active" : ""}`}
              onClick={() => onModelChange(m.id)}
            >
              <div className="model-radio">
                <div className={`radio-dot ${selectedModel === m.id ? "active" : ""}`} />
              </div>
              <div className="model-info">
                <div className="model-name">{m.name}</div>
                <div className="model-desc">{m.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predict Button */}
      <button
        className="cp-btn-predict"
        onClick={onPredict}
        disabled={!selectedStock || loading}
      >
        {loading ? (
          <>
            <div className="spinner-small" />
            <span>Generating Forecast...</span>
          </>
        ) : (
          <>
            <span className="icon">▶</span>
            <span>Generate Prediction</span>
          </>
        )}
      </button>
    </div>
  );
}

// ── Results Panel Component ───────────────────────────────────
function ResultsPanel({ 
  stock, prediction, models, loading, selectedModel, days, tab, onTabChange
}) {
  if (!stock && !loading) {
    return (
      <div className="results-empty">
        <div className="empty-illustration">📈</div>
        <h2 className="empty-title">Start Predicting</h2>
        <p className="empty-text">
          Search for a stock or select from popular picks to begin forecasting
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="results-empty">
        <div className="spinner" />
        <h2 className="empty-title">
          Running {models.find(m => m.id === selectedModel)?.name}...
        </h2>
        <p className="empty-text">Analyzing market data and generating forecast</p>
      </div>
    );
  }

  if (!stock) return null;

  const lastPrice = stock.current_price;
  const finalPred = prediction?.predictions?.[prediction.predictions.length - 1]?.price;
  const priceChange = lastPrice && finalPred ? ((finalPred - lastPrice) / lastPrice) * 100 : null;
  const dayChange = stock.change_percent;

  const chartData = stock?.history ? [
    ...stock.history.slice(-50).map(h => ({ 
      date: h.date, 
      actual: h.close, 
      predicted: null 
    })),
    ...(prediction?.predictions || []).map((p, idx) => ({
      date: p.date,
      actual: null,
      predicted: p.price,
    })),
  ] : [];

  const modelInfo = models.find(m => m.id === selectedModel);

  return (
    <div className="results-panel">
      {/* Stock Header */}
      <div className="stock-header">
        <div className="stock-identity">
          <h1 className="stock-symbol">{stock.symbol}</h1>
          <p className="stock-name">{stock.name}</p>
        </div>
        <div className="stock-stats">
          <div className="price-display">
            <span className="price-value">{fmt(lastPrice)}</span>
            <span className={`price-change ${dayChange >= 0 ? "positive" : "negative"}`}>
              {fmtPct(dayChange)} today
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Open</div>
          <div className="metric-value">{fmt(stock.open)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">High</div>
          <div className="metric-value">{fmt(stock.high)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Low</div>
          <div className="metric-value">{fmt(stock.low)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Volume</div>
          <div className="metric-value">{fmtVolume(stock.volume)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">52W High</div>
          <div className="metric-value">{fmt(stock.week_52_high)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">52W Low</div>
          <div className="metric-value">{fmt(stock.week_52_low)}</div>
        </div>
      </div>

      {/* Prediction Summary */}
      {prediction && (
        <div className="prediction-summary">
          <div className="pred-header">
            <div>
              <div className="pred-label">AI Forecast · {days} Days</div>
              <div className="pred-target">{fmt(finalPred)}</div>
            </div>
            <div className="pred-change-box">
              <div className={`pred-change ${priceChange >= 0 ? "positive" : "negative"}`}>
                {fmtPct(priceChange)}
              </div>
              <div className="pred-confidence">
                <span className="conf-label">Confidence</span>
                <div className="conf-bar">
                  <div
                    className="conf-fill"
                    style={{ width: `${(prediction.confidence || 0) * 100}%` }}
                  />
                </div>
                <span className="conf-pct">{((prediction.confidence || 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        {["Chart", "Table", "Model Details"].map((tabName) => (
          <button
            key={tabName}
            className={`tab-btn ${tab === tabName.toLowerCase() ? "active" : ""}`}
            onClick={() => onTabChange(tabName.toLowerCase())}
          >
            {tabName}
          </button>
        ))}
      </div>

      {/* Chart Tab */}
      {tab === "chart" && (
        <div className="chart-container">
          <div className="chart-header">
            <h3>Price Forecast</h3>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: "#3b82f6" }} />
                Historical
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: "#10b981" }} />
                Predicted
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cg-actual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cg-pred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
              />
              <Tooltip content={<ChartTooltip />} />
              {stock.history && (
                <ReferenceLine
                  x={stock.history[stock.history.length - 1]?.date}
                  stroke="#d1d5db"
                  strokeDasharray="5 5"
                  label={{ value: "Today", fill: "#6b7280", fontSize: 11 }}
                />
              )}
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                fill="url(#cg-actual)"
                strokeWidth={2.5}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#10b981"
                strokeDasharray="5 5"
                fill="url(#cg-pred)"
                strokeWidth={2.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table Tab */}
      {tab === "table" && prediction && (
        <div className="table-container">
          <table className="prediction-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Predicted</th>
                <th>vs Current</th>
                <th>Range (Low-High)</th>
              </tr>
            </thead>
            <tbody>
              {prediction.predictions.map((p, idx) => {
                const chg = ((p.price - lastPrice) / lastPrice) * 100;
                return (
                  <tr key={idx}>
                    <td className="td-date">{p.date}</td>
                    <td className="td-price">{fmt(p.price)}</td>
                    <td className={`td-change ${chg >= 0 ? "positive" : "negative"}`}>
                      {fmtPct(chg)}
                    </td>
                    <td className="td-range">
                      {fmt(p.lower)} — {fmt(p.upper)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Model Details Tab */}
      {tab === "model details" && modelInfo && (
        <div className="model-details">
          <div className="detail-card">
            <h4>Architecture</h4>
            <p>{modelInfo.architecture}</p>
          </div>
          <div className="detail-card">
            <h4>Key Features</h4>
            <p>{modelInfo.features}</p>
          </div>
          <div className="detail-card">
            <h4>Performance Metrics</h4>
            <p>{modelInfo.performance}</p>
          </div>
          <div className="detail-card">
            <h4>Model</h4>
            <p>
              {modelInfo.name} • {modelInfo.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Prediction Page ──────────────────────────────────────
export default function PredictionPage() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("lstm");
  const [selectedStock, setSelectedStock] = useState(null);
  const [inputSymbol, setInputSymbol] = useState("");
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [tab, setTab] = useState("chart");
  const [error, setError] = useState("");

  // Fetch available models on mount
  useEffect(() => {
    fetchModels();
    // Load AAPL by default
    loadStock("AAPL");
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_BASE}/models`);
      const data = await res.json();
      setModels(data.models || []);
    } catch (err) {
      console.error("Failed to load models:", err);
      setError("Could not connect to backend. Ensure the API is running.");
    }
  };

  const loadStock = async (symbol) => {
    try {
      setError("");
      setLoading(true);
      const res = await fetch(`${API_BASE}/stock/${symbol}`);
      
      if (!res.ok) {
        throw new Error(`Stock not found: ${symbol}`);
      }
      
      const data = await res.json();
      setSelectedStock({ symbol: data.symbol });
      setStock(data);
      setInputSymbol(data.symbol);
      setPrediction(null);
      setTab("chart");
    } catch (err) {
      setError(err.message || "Failed to load stock data");
      setStock(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (symbol) => {
    if (!symbol.trim()) return;
    loadStock(symbol);
  };

  const handleQuickPick = (symbol) => {
    loadStock(symbol);
  };

  const generatePrediction = async () => {
    if (!selectedStock) return;

    try {
      setError("");
      setLoading(true);
      setPrediction(null);
      
      const res = await fetch(
        `${API_BASE}/predict/${selectedStock.symbol}?days=${days}&model=${selectedModel}`
      );
      
      if (!res.ok) {
        throw new Error("Prediction failed");
      }
      
      const data = await res.json();
      setPrediction(data);
      setTab("chart");
    } catch (err) {
      setError(err.message || "Failed to generate prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-badge">AI PREDICTION ENGINE</div>
          <h1 className="header-title">Stock Price Forecaster</h1>
          <p className="header-subtitle">
            Leverage machine learning to predict stock prices with confidence intervals
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button className="error-close" onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* Main Layout */}
      <div className="prediction-layout">
        {/* Control Panel - Left */}
        <div className="layout-left">
          <ControlPanel
            models={models}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            selectedStock={selectedStock}
            inputSymbol={inputSymbol}
            onInputChange={setInputSymbol}
            days={days}
            onDaysChange={setDays}
            loading={loading}
            onSearch={handleSearch}
            onQuickPick={handleQuickPick}
            onPredict={generatePrediction}
          />
        </div>

        {/* Results Panel - Right */}
        <div className="layout-right">
          <ResultsPanel
            stock={stock}
            prediction={prediction}
            models={models}
            loading={loading}
            selectedModel={selectedModel}
            days={days}
            tab={tab}
            onTabChange={setTab}
          />
        </div>
      </div>
    </div>
  );
}
