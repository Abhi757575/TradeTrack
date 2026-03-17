import { fmt, fmtPct } from "../utils/stockData";

/**
 * Horizontally scrolling live ticker tape strip.
 * Mock data — swap for live API in production.
 */
export default function TickerTape() {
  const TAPE = [
    { sym: "AAPL", price: 213.49, change: 1.42 },
    { sym: "GOOGL", price: 155.32, change: 0.89 },
    { sym: "MSFT", price: 412.67, change: 2.14 },
    { sym: "TSLA", price: 242.19, change: -1.23 },
    { sym: "AMZN", price: 189.45, change: 3.45 },
    { sym: "NVDA", price: 891.23, change: 5.67 },
  ];

  // Triplicate for seamless infinite scroll
  const items = [...TAPE, ...TAPE, ...TAPE];

  return (
    <div className="ticker-tape">
      <div className="ticker-inner">
        {items.map((t, i) => (
          <div className="ti" key={i}>
            <span className="ti-sym">{t.sym}</span>
            <span className="ti-price">{fmt(t.price)}</span>
            <span className={t.change >= 0 ? "ti-up" : "ti-dn"}>
              {fmtPct(t.change)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
