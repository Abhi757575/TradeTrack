import "../styles/contact.css";

function Contact() {
  return (
    <section className="contact-shell">
      <div className="contact-header">
        <p className="eyebrow">Research desk</p>
        <h2>Share your briefing, launch your watchlist.</h2>
        <p>
          Whether you need a pre-market signal, a bespoke macro overlay, or a
          fully managed portfolio scenario, we reply within one trading session.
        </p>
      </div>

      <div className="contact-grid">
        <div className="contact-panel">
          <div>
            <h3>Stock strategists</h3>
            <p>Research@pulseai.app</p>
            <p>+1 (415) 555-0112</p>
          </div>
          <div>
            <h3>Live coverage</h3>
            <p>24/5 pre, regular, and extended-hour desks</p>
            <p>Command center in Chicago & remote</p>
          </div>
          <div>
            <h3>Deck drop</h3>
            <p>Attach a CSV, Figma, or Notion brief and we sync it into a live doc.</p>
          </div>
        </div>

        <form className="contact-form">
          <label>
            Name
            <input placeholder="Morgan Hale" />
          </label>
          <label>
            Email
            <input type="email" placeholder="morgan@fund.com" />
          </label>
          <label>
            Fund / Desk
            <input placeholder="Aurora Quant" />
          </label>
          <label>
            Ticker / Theme
            <input placeholder="e.g., NVDA, AI compute, semis" />
          </label>
          <label>
            What do you need?
            <textarea placeholder="Pre-market signal, risk overlay, pitch deck notes, etc." />
          </label>
          <button type="button">Send request</button>
        </form>
      </div>
    </section>
  );
}

export default Contact;
