import "../styles/navbar.css";

const NAV_ITEMS = [
  { id: "home", label: "Overview" },
  { id: "predictor", label: "Predictions" },
  { id: "contact", label: "Contact" },
];

function Navbar({ currentPage, onNavigate }) {
  return (
    <header className="nav-shell">
      <div className="nav-brand" onClick={() => onNavigate("home")}>
        PulseAI
        <span>Live Pulse Intelligence</span>
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
      <div className="nav-actions">
        <button className="nav-cta" onClick={() => onNavigate("predictor")}>
          Launch Predictor
        </button>
      </div>
    </header>
  );
}

export default Navbar;
