import { useState } from "react";
import "../styles/landing.css";

export default function LandingPage({ onNavigate }) {
  const [email, setEmail] = useState("");

  const features = [
    {
      icon: "🤖",
      title: "AI-Powered Predictions",
      desc: "6 machine learning models working together for accurate stock price forecasting"
    },
    {
      icon: "📈",
      title: "Real-Time Data",
      desc: "Live market data from yfinance with 12+ technical indicators calculated automatically"
    },
    {
      icon: "🎯",
      title: "Confidence Scoring",
      desc: "AI-powered confidence metrics (0-100%) with prediction ranges for better decision making"
    },
    {
      icon: "📊",
      title: "Interactive Charts",
      desc: "Beautiful Recharts visualizations with historical data and predictions side-by-side"
    },
    {
      icon: "🔄",
      title: "Multiple Models",
      desc: "Choose from LSTM, XGBoost, Gradient Boosting, Random Forest, SVM, and ensemble predictions"
    },
    {
      icon: "📱",
      title: "Fully Responsive",
      desc: "Works perfectly on desktop, tablet, and mobile devices with a clean light theme"
    },
  ];

  const models = [
    {
      name: "LSTM",
      strength: "Trends",
      accuracy: "2.2%",
      speed: "⚡⚡",
      description: "Long Short-Term Memory neural network with attention mechanism"
    },
    {
      name: "XGBoost",
      strength: "Volatility",
      accuracy: "2.5%",
      speed: "⚡⚡⚡",
      description: "Gradient boosted decision trees for rapid predictions"
    },
    {
      name: "Gradient Boosting",
      strength: "Balanced",
      accuracy: "2.3%",
      speed: "⚡⚡",
      description: "Sequential ensemble with robust pattern recognition"
    },
    {
      name: "Random Forest",
      strength: "Stability",
      accuracy: "2.7%",
      speed: "⚡⚡",
      description: "Parallel tree ensemble reducing variance"
    },
    {
      name: "SVM",
      strength: "Non-linear",
      accuracy: "3.0%",
      speed: "⚡",
      description: "Support Vector Machine with RBF kernel"
    },
    {
      name: "Ensemble",
      strength: "Recommended",
      accuracy: "2.3%",
      speed: "⚡⚡",
      description: "Combines LSTM, XGBoost, and Gradient Boosting"
    },
  ];

  const stats = [
    { number: "6", label: "ML Models", icon: "🤖" },
    { number: "12+", label: "Indicators", icon: "📊" },
    { number: "90", label: "Forecast Days", icon: "📅" },
    { number: "100K+", label: "Stocks", icon: "🌍" },
  ];

  const handleNewsletterSignup = (e) => {
    e.preventDefault();
    if (email) {
      alert(`Thanks for signing up with ${email}!`);
      setEmail("");
    }
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            AI-Powered Stock Price <span className="highlight">Predictions</span>
          </h1>
          <p className="hero-subtitle">
            Leverage machine learning to forecast stock prices with confidence intervals using real-time market data
          </p>
          <div className="hero-cta">
            <button
              className="cta-primary"
              onClick={() => onNavigate("predictor")}
            >
              <span className="cta-icon">🚀</span> Start Predicting
            </button>
            <button
              className="cta-secondary"
              onClick={() => document.getElementById("features").scrollIntoView({ behavior: "smooth" })}
            >
              <span className="cta-icon">📖</span> Learn More
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="chart-placeholder">
            <div className="chart-bar bar1" style={{ height: "40%" }}></div>
            <div className="chart-bar bar2" style={{ height: "55%" }}></div>
            <div className="chart-bar bar3" style={{ height: "35%" }}></div>
            <div className="chart-bar bar4" style={{ height: "65%" }}></div>
            <div className="chart-bar bar5" style={{ height: "50%" }}></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Why Choose PulseAI?</h2>
          <p className="section-subtitle">
            Industry-leading features for stock price prediction
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Models Section */}
      <section className="models-section">
        <div className="section-header">
          <h2 className="section-title">Available ML Models</h2>
          <p className="section-subtitle">
            6 advanced algorithms for different prediction needs
          </p>
        </div>

        <div className="models-grid">
          {models.map((model, idx) => (
            <div key={idx} className="model-card">
              <div className="model-header">
                <h3 className="model-name">{model.name}</h3>
                <span className="model-speed">{model.speed}</span>
              </div>
              <p className="model-description">{model.description}</p>
              <div className="model-stats">
                <div className="model-stat">
                  <span className="stat-label">Best For</span>
                  <span className="stat-value">{model.strength}</span>
                </div>
                <div className="model-stat">
                  <span className="stat-label">RMSE</span>
                  <span className="stat-value">{model.accuracy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Search Stock</h3>
            <p>Enter a stock ticker symbol (e.g., AAPL, GOOGL, TSLA)</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Select Model</h3>
            <p>Choose from 6 ML models or use ensemble prediction</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Set Horizon</h3>
            <p>Adjust forecast period from 1 to 90 days</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Get Prediction</h3>
            <p>Receive AI forecast with confidence scores and intervals</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="section-header">
          <h2 className="section-title">Simple Pricing</h2>
          <p className="section-subtitle">
            Start predicting for free, upgrade anytime
          </p>
        </div>

        <div className="pricing-cards">
          <div className="pricing-card free">
            <h3>Free</h3>
            <div className="price">$0<span>/month</span></div>
            <ul className="price-features">
              <li>✓ Up to 10 predictions/day</li>
              <li>✓ 2 ML models</li>
              <li>✓ Basic charts</li>
              <li>✗ Advanced analytics</li>
              <li>✗ Email support</li>
            </ul>
            <button className="price-btn">Get Started</button>
          </div>

          <div className="pricing-card pro">
            <div className="badge">Popular</div>
            <h3>Pro</h3>
            <div className="price">$9<span>/month</span></div>
            <ul className="price-features">
              <li>✓ Unlimited predictions</li>
              <li>✓ All 6 models + ensemble</li>
              <li>✓ Advanced analytics</li>
              <li>✓ Portfolio tracking</li>
              <li>✓ Email support</li>
            </ul>
            <button className="price-btn primary">Start Free Trial</button>
          </div>

          <div className="pricing-card enterprise">
            <h3>Enterprise</h3>
            <div className="price">Custom</div>
            <ul className="price-features">
              <li>✓ Everything in Pro</li>
              <li>✓ API access</li>
              <li>✓ Custom models</li>
              <li>✓ Priority support</li>
              <li>✓ SLA guarantee</li>
            </ul>
            <button className="price-btn">Contact Sales</button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <h2>Stay Updated</h2>
          <p>Get the latest updates on stock predictions and market insights</p>
          <form className="newsletter-form" onSubmit={handleNewsletterSignup}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta">
        <h2>Ready to Start Predicting?</h2>
        <p>Join thousands of traders using AI-powered predictions</p>
        <button
          className="cta-large"
          onClick={() => onNavigate("predictor")}
        >
          Launch Predictor 🚀
        </button>
      </section>
    </div>
  );
}
