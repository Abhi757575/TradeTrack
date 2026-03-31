import "../styles/navbar.css";

const NAV_ITEMS = [
  { id: "home", label: "Overview" },
  { id: "predictor", label: "Predictions" },
  { id: "contact", label: "Contact" },
];

function Navbar({ currentPage, onNavigate }) {
  return (
    <header className="nav-shell">
      <div className="nav-left">
        <div className="nav-brand" onClick={() => onNavigate("home")}>
          TradeTrack
          <span>Live Trade Intelligence</span>
        </div>
      </div>
      <nav className="nav-links">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-link ${currentPage === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

export default Navbar;
