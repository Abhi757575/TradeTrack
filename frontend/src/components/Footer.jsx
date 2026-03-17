import "../styles/footer.css";

/**
 * Shared footer used on Landing and Contact pages.
 * @prop {boolean} full - Show full link row (Landing) vs compact (Contact)
 */
export default function Footer({ full = false }) {
  const links = ["Privacy Policy", "Terms", "API Docs", "Status", "Blog"];

  return (
    <footer className="footer">
      <div className="footer-logo">
        PULSE<span>AI</span>
      </div>

      {full && (
        <div className="footer-links">
          {links.map((l) => (
            <span className="footer-link" key={l}>{l}</span>
          ))}
        </div>
      )}

      <div className="footer-copy">
        © 2025 PulseAI Technologies Inc. All rights reserved.
      </div>
    </footer>
  );
}
