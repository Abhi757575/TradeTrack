import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import "../styles/prediction.css";
import ChartTooltip from "./ChartTooltip";
import { fmt, fmtPct } from "../utils/stockData";
import { API_BASE } from "../config/api";

const MODELS = [
  { id: "lstm", name: "LSTM", desc: "Best for trends" },
  { id: "xgboost", name: "XGBoost", desc: "Best for volatility" },
  { id: "ensemble", name: "Ensemble", desc: "Recommended" },
];

const POPULAR_STOCKS = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA"];

// ── Control Panel ─────────────────────────────────────────────
function ControlPanel({
  sym,
  inputSym,
  setInputSym,
  days,
  setDays,
  model,
  setModel,
  loading,
  onSearch,
  onChipClick,
  onRun,
}) {
  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(inputSym);
  };

  return (
    <div className="ctrl-panel fade-up d1">
      {/* Symbol search */}
      <div>
        <div className="cp-label">Search Ticker</div>
        <form className="cp-search" onSubmit={handleSearch}>
          <input
            className="cp-input"
            value={inputSym}
            onChange={(e) => setInputSym(e.target.value.toUpperCase())}
            placeholder="e.g. AAPL"
            maxLength={6}
          />
          <button type="submit" className="cp-go">
            GO
          </button>
        </form>
      </div>

      {/* Quick pick chips */}
      <div>
        <div className="cp-label">Quick Pick</div>
        <div className="cp-chips">
          {POPULAR_STOCKS.map((stock) => (
            <button
              key={stock}
              className={`cp-chip ${sym === stock ? "active" : ""}`}
              onClick={() => onChipClick(stock)}
            >
              {stock}
            </button>
          ))}
        </div>
      </div>

      {/* Forecast horizon */}
      <div>
        <div className="cp-label">Forecast Horizon</div>
        <div className="cp-range-val">{days} days</div>
        <input
          type="range"
          className="range-input"
          min={1}
          max={30}
          value={days}
          onChange={(e) => setDays(+e.target.value)}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            color: "var(--text-dim)",
          }}
        >
          <span>1d</span>
          <span>30d</span>
        </div>
      </div>

      {/* Model selector */}
      <div>
        <div className="cp-label">Model</div>
        {MODELS.map((m) => (
          <div
            key={m.id}
            className={`model-opt ${model === m.id ? "active" : ""}`}
            onClick={() => setModel(m.id)}
          >
            <div className="mo-dot" />
            <div>
              <div className="mo-name">{m.name}</div>
              <div className="mo-desc">{m.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <button className="run-btn" disabled={loading} onClick={onRun}>
        {loading ? (
          <>
            <div className="spinner" />
            Running…
          </>
        ) : (
          <>▶ Run Prediction</>
        )}
      </button>
    </div>
  );
}

// ── Results Panel ─────────────────────────────────────────────
function ResultsPanel({
  stockData,
  prediction,
  loading,
  sym,
  model,
  days,
  tab,
  setTab,
}) {
  const lastPrice = stockData?.current_price;
  const finalPred = prediction?.predictions?.[prediction.predictions.length - 1]?.price;
  const predChg = lastPrice && finalPred ? ((finalPred - lastPrice) / lastPrice) * 100 : null;
  const dayChange = stockData?.change_percent;

  const chartData = stockData
    ? [
        ...stockData.history.slice(-40).map((h) => ({
          date: h.date,
          actual: h.close,
          predicted: null,
        })),
        ...(prediction?.predictions || []).map((p) => ({
          date: p.date,
          actual: null,
          predicted: p.price,
        })),
      ]
    : [];

  if (!stockData && !loading) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📈</div>
        <div className="empty-title">Select a ticker to begin</div>
        <div>Pick from quick select or search by symbol</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <div className="empty-title">
          Running {MODELS.find((m) => m.id === model)?.name}…
        </div>
        <div style={{ color: "var(--text-dim)" }}>
          Generating {days}-day forecast
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero bar */}
      <div className="shb fade-up">
        <div>
          <div className="shb-sym">{stockData.symbol}</div>
          <div className="shb-name">{stockData.name}</div>
        </div>
        <div>
          <div className="shb-price">{fmt(lastPrice)}</div>
          <div className={`shb-chg ${dayChange >= 0 ? "green" : "red"}`}>
            {fmtPct(dayChange)} today
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-row fade-up d1">
        {[
          { l: "Open", v: fmt(stockData.open) },
          { l: "High", v: fmt(stockData.high) },
          { l: "Low", v: fmt(stockData.low) },
          { l: "Volume", v: (stockData.volume / 1e6).toFixed(1) + "M" },
          { l: "52W High", v: fmt(stockData.week_52_high) },
          { l: "52W Low", v: fmt(stockData.week_52_low) },
        ].map((s) => (
          <div className="sc" key={s.l}>
            <div className="sc-label">{s.l}</div>
            <div className="sc-val">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Prediction banner */}
      {prediction && (
        <div className="pred-banner fade-up d2">
          <div>
            <div className="pb-label">
              AI Target · {days}D · {prediction.model}
            </div>
            <div className="pb-price">{fmt(finalPred)}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
              {prediction.predictions.length} trading day forecast
            </div>
          </div>
          {predChg != null && (
            <div className={`pb-chg ${predChg >= 0 ? "up" : "dn"}`}>
              {fmtPct(predChg)}
            </div>
          )}
          <div className="pb-conf">
            <span
              style={{
                fontSize: 10,
                color: "var(--text-dim)",
                letterSpacing: 1,
              }}
            >
              CONFIDENCE
            </span>
            <div className="conf-bg">
              <div
                className="conf-fill"
                style={{ width: `${(prediction.confidence || 0) * 100}%` }}
              />
            </div>
            <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>
              {((prediction.confidence || 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-row">
        {["chart", "table", "model info"].map((t) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Chart tab */}
      {tab === "chart" && (
        <div className="chart-card fade-up">
          <div className="cc-header">
            <div className="cc-title">Price History + Forecast</div>
            <div className="legend-row" style={{ margin: 0 }}>
              <div className="leg-item">
                <div className="leg-dot" style={{ background: "#0ea5e9" }} />
                Actual
              </div>
              <div className="leg-item">
                <div className="leg-dot" style={{ background: "#00d4aa" }} />
                Predicted
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6e7f8f", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={9}
              />
              <YAxis
                tick={{ fill: "#6e7f8f", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
                width={55}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine
                x={
                  stockData.history[stockData.history.length - 1]?.date
                }
                stroke="#1e2d3d"
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#0ea5e9"
                strokeWidth={2}
                fill="url(#cg1)"
                dot={false}
                name="Actual"
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#00d4aa"
                strokeWidth={2}
                strokeDasharray="6 3"
                fill="url(#cg2)"
                dot={false}
                name="Predicted"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table tab */}
      {tab === "table" && prediction && (
        <div
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
          }}
          className="fade-up"
        >
          <table className="pred-tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Predicted</th>
                <th>vs Current</th>
                <th>Lower</th>
                <th>Upper</th>
              </tr>
            </thead>
            <tbody>
              {prediction.predictions.map((p, i) => {
                const chg = ((p.price - lastPrice) / lastPrice) * 100;
                return (
                  <tr key={i}>
                    <td className="td-bold">{p.date}</td>
                    <td>{fmt(p.price)}</td>
                    <td className={chg >= 0 ? "green" : "red"}>{fmtPct(chg)}</td>
                    <td style={{ color: "var(--text-dim)" }}>{fmt(p.lower)}</td>
                    <td style={{ color: "var(--text-dim)" }}>{fmt(p.upper)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Model info tab */}
      {tab === "model info" && (
        <div className="mi-grid fade-up">
          {[
            {
              t: "Architecture",
              b: "2-layer LSTM with attention mechanism. Trained on 60-day sliding windows.",
            },
            {
              t: "Features",
              b: "Close, Volume, RSI-14, MACD, Signal, BB%, SMA-50, SMA-200, EMA-12/26.",
            },
            {
              t: "Training",
              b: "Adam optimizer, 0.001 learning rate, 100 epochs, early stopping.",
            },
            {
              t: "Performance",
              b: `Confidence: ${((prediction?.confidence || 0) * 100).toFixed(0)}%`,
            },
          ].map((c, i) => (
            <div className="mi-card" key={i}>
              <h4>{c.t}</h4>
              <p>{c.b}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Prediction Page ───────────────────────────────────────────
export default function Prediction() {
  const [sym, setSym] = useState("AAPL");
  const [inputSym, setInputSym] = useState("AAPL");
  const [days, setDays] = useState(7);
  const [model, setModel] = useState("lstm");
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [tab, setTab] = useState("chart");
  const [error, setError] = useState("");

  // Load initial stock data
  useEffect(() => {
    loadStock("AAPL");
  }, []);

  const loadStock = async (symbol) => {
    try {
      setError("");
      setLoading(true);
      const res = await fetch(`${API_BASE}/stock/${symbol}`);

      if (!res.ok) {
        throw new Error("Stock not found");
      }

      const data = await res.json();
      setSym(data.symbol);
      setStockData(data);
      setInputSym(data.symbol);
      setPrediction(null);
      setTab("chart");
    } catch (err) {
      setError(err.message || "Failed to load stock");
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  const generatePrediction = async () => {
    if (!stockData) return;

    try {
      setError("");
      setLoading(true);
      setPrediction(null);

      const res = await fetch(
        `${API_BASE}/predict/${stockData.symbol}?days=${days}&model=${model}`
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

  const handleSearch = (symbol) => {
    if (symbol.trim()) {
      loadStock(symbol.trim());
    }
  };

  const handleQuickPick = (symbol) => {
    loadStock(symbol);
  };

  return (
    <div className="page">
      <div className="pred-page">
        <div className="fade-up">
          <div className="section-tag">AI Prediction Engine</div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px,4vw,46px)",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: -1,
              marginBottom: 6,
            }}
          >
            Stock Price Forecaster
          </div>
          <div style={{ color: "var(--text-dim)", fontSize: 13 }}>
            Choose a ticker, select a model, and get AI-powered price forecasts
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "12px 16px",
              borderRadius: 8,
              marginBottom: 20,
              marginTop: 20,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div className="pred-layout">
          <ControlPanel
            sym={sym}
            inputSym={inputSym}
            setInputSym={setInputSym}
            days={days}
            setDays={setDays}
            model={model}
            setModel={setModel}
            loading={loading}
            onSearch={handleSearch}
            onChipClick={handleQuickPick}
            onRun={generatePrediction}
          />
          <div className="results-panel">
            <ResultsPanel
              stockData={stockData}
              prediction={prediction}
              loading={loading}
              sym={sym}
              model={model}
              days={days}
              tab={tab}
              setTab={setTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
