import "../styles/landing.css";
import LineGraph from "../components/LineGraph";

const priceTrace = [118, 125, 132, 129, 141, 147, 151, 144, 158, 165];
const liveStats = [
  { label: "Tickers tracked", value: "64", detail: "live watchlist" },
  { label: "Sharpe gain", value: "+1.28", detail: "vs. S&P 30 days" },
  { label: "Signal freshness", value: "9s", detail: "Update cadence" },
];

const insights = [
  "Latency-aware alerts for gap openings",
  "Macro + micro context blended into every share",
  "Position sizing guidance built from live liquidity",
];

function Landing({ onNavigate }) {
  return (
    <section className="landing-shell">
      <div className="hero-grid">
        <div>
          <p className="eyebrow">Stock Prediction Studio</p>
          <h1>See the market pulse, then stake your move with conviction.</h1>
          <p className="hero-copy">
            PulseAI pairs quantitative rigor with narrative clarity so you can
            plan trades, orchestrate launches, and share why the next signal is
            worth action before the bell rings.
          </p>
          <div className="hero-actions">
            <button className="hero-cta" onClick={() => onNavigate("predictor")}>
              Open the predictive ledger
            </button>
            <button className="hero-ghost" onClick={() => onNavigate("contact")}>
              Talk to the research desk
            </button>
          </div>
        </div>
        <div className="hero-spotlight">
          <p>Market tempo</p>
          <div className="signal-card">
            <p className="signal-label">FAANG pulse</p>
            <h3>Momentum rally</h3>
            <LineGraph data={priceTrace} width={360} height={160} gradientId="landingGradient" />
            <div className="signal-meta">
              <span>Volume +12%</span>
              <span>Spread 1.3bps</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-row">
        {liveStats.map((item) => (
          <article key={item.label} className="stat-card">
            <p className="stat-label">{item.label}</p>
            <h2>{item.value}</h2>
            <p className="stat-detail">{item.detail}</p>
          </article>
        ))}
      </div>

      <div className="insights-grid">
        <div className="insights-panel">
          <h3>Context that feels like your trading desk</h3>
          <p>
            Signals, scenario notes, and liquidity overlays converge so every
            prediction becomes a story you can defend with both numbers and
            narrative.
          </p>
        </div>
        <ul className="insight-list">
          {insights.map((item) => (
            <li key={item}>
              <span />
              <p>{item}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="timeline-cta">
        <div>
          <h3>Trading day rhythm</h3>
          <p>Follow ledgers that refresh before pre-market, midday, and close.</p>
        </div>
        <div className="timeline-card">
          <p>7:00 AM</p>
          <p>Pre-market briefing + inflows</p>
        </div>
        <div className="timeline-card">
          <p>12:30 PM</p>
          <p>Momentum dispatch + risk check</p>
        </div>
        <div className="timeline-card">
          <p>4:15 PM</p>
          <p>Close recap + next-day setups</p>
        </div>
      </div>

      <div className="cta-strip">
        <div>
          <h3>Ready to bring your portfolio insight to live action?</h3>
          <p>Launch a custom watchlist and prediction stream in minutes.</p>
        </div>
        <button className="hero-cta" onClick={() => onNavigate("contact")}>
          Book a research call
        </button>
      </div>
    </section>
  );
}

export default Landing;
