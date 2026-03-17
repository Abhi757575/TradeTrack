import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import "../styles/landing.css";
import TickerTape from "./TickerTape";
import Footer from "./Footer";
import ChartTooltip from "./ChartTooltip";
import { genHistory, genPreds, fmt } from "../utils/stockData";

// ── Hero Section ──────────────────────────────────────────────
function HeroSection({ onNavigate }) {
  return (
    <section className="hero">
      <div className="hero-grid" />
      <div className="hero-glow" />
      
      <div className="hero-content">
        <div className="fade-up">
          <span className="badge">
            <span className="pulse-dot" />
            Live Markets · 500+ Tickers
          </span>
        </div>

        <h1 className="hero-title fade-up d1">
          Predict.<br />
          <span className="accent">Profit.</span><br />
          <span className="dim">Outperform.</span>
        </h1>

        <p className="hero-sub fade-up d2">
          PulseAI uses state-of-the-art neural networks and real-time
          market data to forecast stock prices up to 30 days ahead —
          with confidence intervals you can actually trade on.
        </p>

        <div className="hero-actions fade-up d3">
          <button className="btn-primary" onClick={() => onNavigate("predictor")}>
            ▶ Try the Predictor
          </button>
          <button className="btn-ghost" onClick={() => onNavigate("contact")}>
            Request a Demo
          </button>
        </div>

        <div className="hero-stats fade-up d4">
          {[
            ["6", "", "ML Models"],
            ["12+", "", "Indicators"],
            ["30", "D", "Max Forecast"],
            ["100K+", "", "Stocks"],
          ].map(([v, s, l]) => (
            <div key={l}>
              <div className="hs-val">{v}<span>{s}</span></div>
              <div className="hs-label">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features Section ──────────────────────────────────────────
function FeaturesSection() {
  const features = [
    { 
      icon: "🧠", 
      name: "6 ML Models", 
      desc: "LSTM, XGBoost, Gradient Boosting, Random Forest, SVM, and Linear Regression" 
    },
    { 
      icon: "⚡", 
      name: "Real-Time Updates", 
      desc: "Sub-second predictions via our FastAPI backend. Updates every 60 seconds." 
    },
    { 
      icon: "📊", 
      name: "12+ Indicators", 
      desc: "RSI, MACD, Bollinger Bands, EMAs, SMAs and more fused into predictions" 
    },
    { 
      icon: "🔒", 
      name: "Secure & Private", 
      desc: "HTTPS encrypted. Your data is never sold. Privacy-first approach." 
    },
    { 
      icon: "🎯", 
      name: "Confidence Scoring", 
      desc: "Every prediction includes a confidence score and prediction interval range" 
    },
    { 
      icon: "📱", 
      name: "Fully Responsive", 
      desc: "Works perfectly on desktop, tablet, and mobile devices" 
    },
  ];

  return (
    <section className="section">
      <div className="sec-header">
        <div className="section-tag">Why PulseAI</div>
        <h2 className="sec-title">Everything you need to predict better</h2>
        <p className="sec-sub">Built by traders and ML engineers who wanted better tools.</p>
      </div>
      
      <div className="feat-grid">
        {features.map((f, i) => (
          <div className="feat-card" key={i}>
            <div className="feat-icon">{f.icon}</div>
            <div className="feat-name">{f.name}</div>
            <div className="feat-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Chart Preview Section ─────────────────────────────────────
function ChartPreviewSection() {
  const [data, setData] = useState([]);
  const [lastPrice, setLastPrice] = useState(null);

  useEffect(() => {
    const hist = genHistory(213.49, 50).slice(-28);
    const preds = genPreds(hist[hist.length - 1].close, 12);
    const lastP = hist[hist.length - 1]?.close;
    
    setLastPrice(lastP);
    setData([
      ...hist.map(h => ({ date: h.date, actual: h.close, predicted: null })),
      ...preds.map(p => ({ date: p.date, actual: null, predicted: p.price })),
    ]);
  }, []);

  return (
    <section className="preview-sec">
      <div className="preview-inner">
        <div className="preview-hdr">
          <div>
            <div className="section-tag">Live Demo</div>
            <div className="preview-title">AAPL — Historical + 12-day AI Forecast</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>
              {fmt(lastPrice)}
            </div>
            <div className="green" style={{ fontSize: 13 }}>+1.42% today</div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
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
              interval={8}
            />
            <YAxis
              tick={{ fill: "#6e7f8f", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
              width={55}
            />
            <Tooltip content={<ChartTooltip />} />
            {data.length > 0 && (
              <ReferenceLine
                x={data.find((d) => d.predicted !== null)?.date}
                stroke="#1e2d3d"
                strokeDasharray="4 4"
              />
            )}
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#0ea5e9"
              strokeWidth={2}
              fill="url(#lg1)"
              dot={false}
              name="Actual"
            />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#00d4aa"
              strokeWidth={2}
              strokeDasharray="6 3"
              fill="url(#lg2)"
              dot={false}
              name="Predicted"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="legend-row">
          <div className="leg-item">
            <div className="leg-dot" style={{ background: "#0ea5e9" }} />
            Actual price
          </div>
          <div className="leg-item">
            <div className="leg-dot" style={{ background: "#00d4aa" }} />
            AI Forecast (dashed)
          </div>
        </div>
      </div>
    </section>
  );
}

// ── How It Works Section ──────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      n: "01",
      title: "Search",
      body: "Enter a stock ticker symbol (AAPL, GOOGL, TSLA, etc.)"
    },
    {
      n: "02",
      title: "Select",
      body: "Choose from 6 ML models or use ensemble averaging"
    },
    {
      n: "03",
      title: "Forecast",
      body: "Set prediction horizon from 1 to 30 days ahead"
    },
    {
      n: "04",
      title: "Analyze",
      body: "Get AI forecast with confidence scores and ranges"
    },
  ];

  return (
    <section className="section">
      <div className="sec-header">
        <div className="section-tag">How It Works</div>
        <h2 className="sec-title">From search to prediction in seconds</h2>
      </div>
      <div className="how-grid">
        {steps.map((s, i) => (
          <div className="how-card" key={i}>
            <div className="how-num">{s.n}</div>
            <div className="how-title">{s.title}</div>
            <div className="how-desc">{s.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Testimonials Section ──────────────────────────────────────
function TestimonialsSection() {
  const testimonials = [
    {
      q: "Confidence intervals are game-changing. Better than any other platform.",
      name: "Jordan K.",
      role: "Retail Investor",
      init: "JK"
    },
    {
      q: "Integrated the API in 2 days. Accuracy holds up in live trading.",
      name: "Sarah M.",
      role: "Quant Analyst",
      init: "SM"
    },
    {
      q: "The UI is clean and the predictions are solid. Highly recommend.",
      name: "Priya R.",
      role: "Portfolio Manager",
      init: "PR"
    },
  ];

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="section-tag">Testimonials</div>
      <h2 className="sec-title">Trusted by traders worldwide</h2>
      <div className="testi-grid">
        {testimonials.map((t, i) => (
          <div className="testi-card" key={i}>
            <div className="testi-stars">★★★★★</div>
            <p className="testi-text">"{t.q}"</p>
            <div className="testi-author">
              <div className="testi-av">{t.init}</div>
              <div>
                <div className="testi-name">{t.name}</div>
                <div className="testi-role">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Pricing Section ───────────────────────────────────────────
function PricingSection({ onNavigate }) {
  const plans = [
    {
      name: "Free",
      price: "0",
      cycle: "Forever free",
      featured: false,
      features: ["5 predictions / day", "7-day forecast", "Basic charts"],
      cta: "Get Started",
      onClick: () => onNavigate("predictor"),
    },
    {
      name: "Pro",
      price: "29",
      cycle: "per month",
      featured: true,
      features: [
        "Unlimited predictions",
        "30-day forecast",
        "Advanced charts",
        "Real-time data",
        "API access",
        "Priority support"
      ],
      cta: "Start Free Trial",
      onClick: () => onNavigate("predictor"),
    },
    {
      name: "Enterprise",
      price: null,
      cycle: "Custom pricing",
      featured: false,
      features: [
        "Everything in Pro",
        "Custom models",
        "Dedicated support",
        "SLA guarantee",
        "Unlimited API",
        "White-label"
      ],
      cta: "Contact Sales",
      onClick: () => onNavigate("contact"),
    },
  ];

  return (
    <div className="pricing-sec">
      <div className="pricing-inner">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="section-tag">Pricing</div>
          <h2 className="sec-title">Simple, transparent pricing</h2>
          <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
            No hidden fees. Cancel anytime.
          </p>
        </div>
        <div className="pricing-grid">
          {plans.map((p, i) => (
            <div className={`pc ${p.featured ? "featured" : ""}`} key={i}>
              {p.featured && <div className="pc-badge">MOST POPULAR</div>}
              <div className="pc-name">{p.name}</div>
              {p.price !== null ? (
                <div className="pc-price">
                  <sup>$</sup>{p.price}
                </div>
              ) : (
                <div className="pc-price" style={{ fontSize: 34, marginBottom: 4 }}>
                  Custom
                </div>
              )}
              <div className="pc-cycle">{p.cycle}</div>
              <ul className="pc-feats">
                {p.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <button className="pc-btn" onClick={p.onClick}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CTA Section ───────────────────────────────────────────────
function CtaSection({ onNavigate }) {
  return (
    <section className="cta-sec">
      <div className="section-tag">Ready?</div>
      <h2 className="cta-title">Start predicting today.</h2>
      <p className="cta-sub">
        Join thousands of traders using PulseAI to stay ahead of the market.
      </p>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn-primary" onClick={() => onNavigate("predictor")}>
          ▶ Launch Predictor
        </button>
        <button className="btn-ghost" onClick={() => onNavigate("contact")}>
          Contact Us
        </button>
      </div>
    </section>
  );
}

// ── Main Landing Component ────────────────────────────────────
export default function Landing({ onNavigate }) {
  return (
    <div className="page">
      <HeroSection onNavigate={onNavigate} />
      <TickerTape />
      <FeaturesSection />
      <ChartPreviewSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection onNavigate={onNavigate} />
      <CtaSection onNavigate={onNavigate} />
      <Footer full />
    </div>
  );
}
