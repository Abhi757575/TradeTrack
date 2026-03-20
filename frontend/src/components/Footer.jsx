import "../styles/footer.css";

function Footer() {
  return (
    <footer className="footer-shell">
      <div>
        <div className="footer-brand">PulseAI</div>
        <p className="footer-tagline">Turning data energy into human stories.</p>
      </div>
      <div className="footer-columns">
        <div>
          <h4>Stay connected</h4>
          <p>Team updates delivered weekly via live briefs.</p>
        </div>
        <div>
          <h4>Contact</h4>
          <p>hello@pulseai.app</p>
          <p>+1 (415) 555-0123</p>
        </div>
        <div>
          <h4>Quick links</h4>
          <p>Product insights</p>
          <p>Case studies</p>
        </div>
      </div>
      <p className="footer-copy">© 2026 PulseAI · Built with optimism.</p>
    </footer>
  );
}

export default Footer;
