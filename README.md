# TradeTrack — Stock Price Prediction

A full-stack AI stock prediction web app with a 3-page React frontend and a FastAPI ML backend.

---

## 📁 Project Structure

```
 TradeTrack/
├── backend/
│   ├── main.py              # FastAPI app — stock data + ML prediction endpoints
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                      # Root — routing between pages
│       ├── main.jsx                     # React entry point
│       │
│       ├── pages/
│       │   ├── Landing.jsx              # Home / marketing page
│       │   ├── Prediction.jsx           # Stock predictor UI
│       │   └── Contact.jsx              # Contact form + FAQ
│       │
│       ├── components/
│       │   ├── Navbar.jsx               # Fixed top nav
│       │   ├── Footer.jsx               # Shared footer
│       │   ├── TickerTape.jsx           # Scrolling price ticker
│       │   └── ChartTooltip.jsx         # Recharts custom tooltip
│       │
│       ├── styles/
│       │   ├── global.css               # CSS variables, base styles, utilities
│       │   ├── navbar.css               # Nav styles
│       │   ├── landing.css              # Landing page styles
│       │   ├── prediction.css           # Predictor page styles
│       │   └── contact.css              # Contact page styles
│       │
│       └── utils/
│           └── stockData.js             # Mock data, formatters, generators
│
└── README.md
```

---

## 🚀 Quick Start

### 1. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python main.py
# API running at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:3000
```

### 3. Streamlit console (optional)

```bash
pip install streamlit httpx pandas
TRADETRACK_API_URL=http://localhost:8000 streamlit run streamlit_app.py
```

The console hits `streamlit_app.py` at the repo root and lets you preview `/stock`, `/features`, and `/predict`. Set `TRADETRACK_API_URL` if your backend runs on a different host or port before running Streamlit.

## 🛡 Authentication APIs

TradeTrack now exposes token-based auth APIs powered by SQLite. Call `/auth/register` (POST name, email, password, confirm_password, date_of_birth) to create an account, `/auth/login` (POST identifier + password) to get access/refresh tokens, `/auth/me` to describe the current user, and `/auth/refresh` to rotate tokens. Credentials are hashed and stored in `backend/users.db`, and the React console at the top of each page now manages the login/register flow, greets the user with “Hi, {name}”, and scrolls to the auth panel when you tap “Login” or “Register” in the navbar.

---

## 🌐 Pages

| Route   | Page        | Description                                                                 |
|---------|-------------|-----------------------------------------------------------------------------|
| `home`  | Landing     | Hero, features, live chart demo, how it works, testimonials, pricing, CTA  |
| `predict` | Predictor | Control panel, ML model selector, forecast chart, predictions table         |
| `contact` | Contact   | Contact form, info cards, office location, FAQ accordion                    |

---

## 🔌 API Endpoints

| Method | Endpoint                      | Description                                 |
|--------|-------------------------------|---------------------------------------------|
| GET    | `/stock/{symbol}`             | Fetch stock info + 1-year price history     |
| POST   | `/predict/{symbol}?days=14`   | Run ML prediction (1–90 days)               |

### Example

```bash
curl http://localhost:8000/stock/AAPL
curl -X POST "http://localhost:8000/predict/NVDA?days=14"
```

---

## 🧠 ML Model

- **Data**: Yahoo Finance via `yfinance` — OHLCV + metadata
- **Features**: Close, Volume, RSI-14, MACD, Bollinger Bands, EMA 12/26, SMA 50/200
- **Prediction**: Momentum + mean-reversion model (drop-in replacement for real LSTM)
- **Output**: Day-by-day prices with upper/lower confidence bounds

### Upgrade to Real LSTM

Replace `lstm_predict()` in `backend/main.py`:

```python
import torch
model = torch.load("lstm_model.pt")
model.eval()

def lstm_predict(prices, days):
    # 1. Normalise input sequence
    # 2. Create 60-day sliding window tensor
    # 3. Run model.forward(x)
    # 4. Denormalise and return predictions
    ...
```

---

## 🎨 Design System

- **Fonts**: Syne (display) + Space Mono (monospace)
- **Theme**: Dark terminal — `#080c10` bg, `#00d4aa` accent, `#0ea5e9` accent2
- **Animations**: CSS `fadeUp` reveals, scanlines overlay, pulsing live badge
- **Charts**: Recharts `AreaChart` with dual-tone actual/forecast gradients

---

## 🛠 Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Recharts, Vite          |
| Backend   | FastAPI, Uvicorn                  |
| Data      | yfinance, pandas, numpy           |
| Styling   | Plain CSS with CSS custom properties |
