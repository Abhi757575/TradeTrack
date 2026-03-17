import { useState } from "react";
import "../styles/contact.css";
import Footer from "./Footer";

// ── Contact Form ──────────────────────────────────────────────
function ContactForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    topic: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateForm = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.firstName || !form.lastName || !form.email || !form.topic || !form.message) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // In production, send to your backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSent(true);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        topic: "",
        message: "",
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="form-card fade-up d1">
        <div className="form-card-title">Send us a message</div>
        <div className="success-state">
          <div className="success-emoji">✅</div>
          <div className="success-title">Message sent!</div>
          <div className="success-sub">
            A team member will respond within 2 business hours.
          </div>
          <button
            className="btn-primary"
            style={{ marginTop: 6 }}
            onClick={() => setSent(false)}
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-card fade-up d1">
      <div className="form-card-title">Send us a message</div>
      <form onSubmit={handleSubmit}>
        <div className="form-row-2">
          <div className="fg">
            <label>First Name *</label>
            <input
              className="fi"
              value={form.firstName}
              onChange={(e) => updateForm("firstName", e.target.value)}
              placeholder="John"
              required
            />
          </div>
          <div className="fg">
            <label>Last Name *</label>
            <input
              className="fi"
              value={form.lastName}
              onChange={(e) => updateForm("lastName", e.target.value)}
              placeholder="Doe"
              required
            />
          </div>
        </div>

        <div className="fg">
          <label>Email Address *</label>
          <input
            className="fi"
            type="email"
            value={form.email}
            onChange={(e) => updateForm("email", e.target.value)}
            placeholder="john@company.com"
            required
          />
        </div>

        <div className="fg">
          <label>Company (optional)</label>
          <input
            className="fi"
            value={form.company}
            onChange={(e) => updateForm("company", e.target.value)}
            placeholder="Acme Capital"
          />
        </div>

        <div className="fg">
          <label>Topic *</label>
          <select
            className="fsel"
            value={form.topic}
            onChange={(e) => updateForm("topic", e.target.value)}
            required
          >
            <option value="">Select a topic…</option>
            <option>General Enquiry</option>
            <option>Enterprise / API Access</option>
            <option>Model Accuracy Question</option>
            <option>Technical Support</option>
            <option>Partnership Opportunity</option>
            <option>Press / Media</option>
          </select>
        </div>

        <div className="fg">
          <label>Message *</label>
          <textarea
            className="fta"
            value={form.message}
            onChange={(e) => updateForm("message", e.target.value)}
            placeholder="Tell us what's on your mind…"
            rows={6}
            required
          />
        </div>

        <button type="submit" className="fsub" disabled={loading}>
          {loading ? "Sending..." : "Send Message →"}
        </button>
      </form>
    </div>
  );
}

// ── Contact Info Cards ────────────────────────────────────────
function ContactInfo() {
  const cards = [
    {
      icon: "📧",
      title: "Email Us",
      body: (
        <>
          <a className="ci-link" href="mailto:hello@pulseai.com">
            hello@pulseai.com
          </a>
          {" — general"}
          <br />
          <a className="ci-link" href="mailto:support@pulseai.com">
            support@pulseai.com
          </a>
          {" — technical"}
        </>
      ),
    },
    {
      icon: "💬",
      title: "Live Chat",
      body: "Mon–Fri, 9am–6pm EST. Average response under 5 minutes.",
    },
    {
      icon: "📞",
      title: "Phone",
      body: (
        <>
          <a className="ci-link" href="tel:+18884442024">
            +1 (888) 444-2024
          </a>
          {" — US"}
          <br />
          {" 9am–5pm EST"}
        </>
      ),
    },
  ];

  return (
    <div className="ci-stack fade-up d2">
      {cards.map((c, i) => (
        <div className="ci-card" key={i}>
          <div className="ci-icon">{c.icon}</div>
          <div className="ci-title">{c.title}</div>
          <div className="ci-text">{c.body}</div>
        </div>
      ))}
    </div>
  );
}

// ── FAQ ───────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState(null);

  const faqs = [
    {
      q: "How accurate are your predictions?",
      a: "Our models achieve 70-85% directional accuracy depending on market conditions. We always show confidence intervals so you can manage risk appropriately.",
    },
    {
      q: "Is my data secure?",
      a: "Yes. All traffic uses HTTPS encryption. We don't store personal trading data. Your privacy is our priority.",
    },
    {
      q: "Can I integrate PulseAI into my own platform?",
      a: "Yes! Pro and Enterprise plans include API access with full documentation and support.",
    },
    {
      q: "Do you support international stocks?",
      a: "Currently we support 500+ US equities (NYSE, NASDAQ). International support is on the roadmap.",
    },
    {
      q: "Can I cancel my subscription anytime?",
      a: "Yes. Cancel anytime from your dashboard. No lock-in, no hidden fees.",
    },
  ];

  return (
    <section className="faq-sec">
      <h2 className="faq-title">Frequently Asked Questions</h2>
      {faqs.map((f, i) => (
        <div className="faq-item" key={i}>
          <button
            className="faq-q"
            onClick={() => setOpen(open === i ? null : i)}
          >
            {f.q}
            <span className={`faq-arrow ${open === i ? "open" : ""}`}>▾</span>
          </button>
          {open === i && <div className="faq-a">{f.a}</div>}
        </div>
      ))}
    </section>
  );
}

// ── Contact Page ──────────────────────────────────────────────
export default function Contact() {
  return (
    <div className="page">
      <div className="contact-page">
        <div className="fade-up">
          <div className="section-tag">Get In Touch</div>
          <h1 className="contact-title">
            We'd love to<br />hear from you.
          </h1>
          <p className="contact-sub">
            Have a question about the models? Need enterprise pricing? Our team
            responds quickly.
          </p>
        </div>

        <div className="contact-layout">
          <ContactForm />
          <ContactInfo />
        </div>
      </div>

      <FAQ />
      <Footer />
    </div>
  );
}
