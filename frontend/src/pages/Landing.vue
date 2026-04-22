<script setup>
import "../styles/landing.css";
import LineGraph from "../components/LineGraph.vue";

const emit = defineEmits(["navigate"]);

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

function go(pageId) {
  emit("navigate", pageId);
}
</script>

<template>
  <section class="landing-shell">
    <div class="hero-grid">
      <div>
        <p class="eyebrow">Stock Prediction Studio</p>
        <h1>See the market pulse, then stake your move with conviction.</h1>
        <p class="hero-copy">
          TradeTrack pairs quantitative rigor with narrative clarity so you can plan trades,
          orchestrate launches, and share why the next signal is worth action before the bell
          rings.
        </p>
        <div class="hero-actions">
          <button class="hero-cta" type="button" @click="go('prediction')">
            Open the predictive ledger
          </button>
          <button class="hero-ghost" type="button" @click="go('contact')">
            Talk to the research desk
          </button>
        </div>
      </div>
      <div class="hero-spotlight">
        <p>Market tempo</p>
        <div class="signal-card">
          <p class="signal-label">FAANG pulse</p>
          <h3>Momentum rally</h3>
          <LineGraph :data="priceTrace" :width="360" :height="160" gradient-id="landingGradient" />
          <div class="signal-meta">
            <span>Volume +12%</span>
            <span>Spread 1.3bps</span>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <article v-for="item in liveStats" :key="item.label" class="stat-card">
        <p class="stat-label">{{ item.label }}</p>
        <h2>{{ item.value }}</h2>
        <p class="stat-detail">{{ item.detail }}</p>
      </article>
    </div>

    <div class="insights-grid">
      <div class="insights-panel">
        <h3>Context that feels like your trading desk</h3>
        <p>
          Signals, scenario notes, and liquidity overlays converge so every prediction becomes
          a story you can defend with both numbers and narrative.
        </p>
      </div>
      <ul class="insight-list">
        <li v-for="item in insights" :key="item">
          <span />
          <p>{{ item }}</p>
        </li>
      </ul>
    </div>

    <div class="timeline-cta">
      <div>
        <h3>Trading day rhythm</h3>
        <p>Follow ledgers that refresh before pre-market, midday, and close.</p>
      </div>
      <div class="timeline-card">
        <p>7:00 AM</p>
        <p>Pre-market briefing + inflows</p>
      </div>
      <div class="timeline-card">
        <p>12:30 PM</p>
        <p>Momentum dispatch + risk check</p>
      </div>
      <div class="timeline-card">
        <p>4:15 PM</p>
        <p>Close recap + next-day setups</p>
      </div>
    </div>

    <div class="cta-strip">
      <div>
        <h3>Ready to bring your portfolio insight to live action?</h3>
        <p>Launch a custom watchlist and prediction stream in minutes.</p>
      </div>
      <button class="hero-cta" type="button" @click="go('contact')">Book a research call</button>
    </div>
  </section>
</template>

