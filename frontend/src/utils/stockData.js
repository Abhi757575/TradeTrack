/**
 * Stock data utility functions
 */

// Format currency
export const fmt = (val) => {
  if (!val && val !== 0) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(val);
};

// Format percentage
export const fmtPct = (val) => {
  if (!val && val !== 0) return "0.00%";
  const sign = val >= 0 ? "+" : "";
  return sign + parseFloat(val).toFixed(2) + "%";
};

// Format volume
export const fmtVolume = (val) => {
  if (!val) return "0";
  if (val >= 1e9) return (val / 1e9).toFixed(1) + "B";
  if (val >= 1e6) return (val / 1e6).toFixed(1) + "M";
  if (val >= 1e3) return (val / 1e3).toFixed(1) + "K";
  return val.toString();
};

// Generate mock historical data
export const genHistory = (basePrice, days) => {
  const data = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const randomChange = (Math.random() - 0.5) * 10;
    const close = basePrice + randomChange;

    data.push({
      date: date.toISOString().split("T")[0],
      open: basePrice,
      close: close,
      high: Math.max(basePrice, close) + Math.random() * 5,
      low: Math.min(basePrice, close) - Math.random() * 5,
      volume: Math.floor(Math.random() * 100e6) + 10e6,
    });

    basePrice = close;
  }

  return data;
};

// Generate mock predictions
export const genPreds = (basePrice, days) => {
  const data = [];
  let currentPrice = basePrice;

  for (let i = 1; i <= days; i++) {
    const trend = (Math.random() - 0.48) * 0.5;
    const nextPrice = currentPrice * (1 + trend);
    const volatility = currentPrice * 0.02;

    data.push({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      price: nextPrice,
      lower: nextPrice - volatility,
      upper: nextPrice + volatility,
    });

    currentPrice = nextPrice;
  }

  return data;
};

// Stock constants
export const STOCKS = {
  AAPL: { symbol: "AAPL", name: "Apple Inc.", price: 213.49 },
  GOOGL: { symbol: "GOOGL", name: "Alphabet Inc.", price: 155.32 },
  MSFT: { symbol: "MSFT", name: "Microsoft Corp.", price: 412.67 },
  TSLA: { symbol: "TSLA", name: "Tesla Inc.", price: 242.19 },
  AMZN: { symbol: "AMZN", name: "Amazon.com Inc.", price: 189.45 },
  NVDA: { symbol: "NVDA", name: "NVIDIA Corp.", price: 891.23 },
};

// Ticker tape data
export const TAPE = [
  { sym: "AAPL", price: 213.49, change: 1.42 },
  { sym: "GOOGL", price: 155.32, change: 0.89 },
  { sym: "MSFT", price: 412.67, change: 2.14 },
  { sym: "TSLA", price: 242.19, change: -1.23 },
  { sym: "AMZN", price: 189.45, change: 3.45 },
  { sym: "NVDA", price: 891.23, change: 5.67 },
];
