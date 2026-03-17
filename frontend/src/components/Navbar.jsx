import { useState } from "react";
import "../styles/navbar.css";

export default function Navbar({ currentPage, onNavigate, user = null, onLogout = null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "predictor", label: "Predictor", icon: "📈" },
    { id: "contact", label: "Contact", icon: "📧" },
  ];

  const handleNavClick = (pageId) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <div className="nav-logo" onClick={() => handleNavClick("home")}>
          <span className="logo-icon">📊</span>
          <span className="logo-text">
            Pulse<span className="logo-ai">AI</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-links-desktop">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${currentPage === item.id ? "active" : ""}`}
              onClick={() => handleNavClick(item.id)}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* User Section */}
        <div className="nav-right">
          {user ? (
            <div className="user-section">
              <span className="user-greeting">👤 {user.name || "User"}</span>
              {onLogout && (
                <button className="nav-logout-btn" onClick={onLogout}>
                  Logout
                </button>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <button className="nav-login-btn" onClick={() => handleNavClick("home")}>
                Login
              </button>
              <button className="nav-signup-btn" onClick={() => handleNavClick("predictor")}>
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="nav-mobile-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`mobile-link ${currentPage === item.id ? "active" : ""}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          {user && (
            <button className="mobile-logout" onClick={onLogout}>
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
