import Link from "next/link";
import { Zap } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Events", href: "/events" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Pricing", href: "#" },
    { label: "AI Features", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Documentation", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-color)",
        padding: "4rem 1.5rem 2rem",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: "3rem",
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <Zap size={18} style={{ fill: "#ffffff" }} />
            </span>
            <span
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              Event<span className="gradient-text">AI</span>
            </span>
          </div>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              maxWidth: "280px",
            }}
          >
            AI-powered event management platform that transforms how you plan,
            organize, and experience events.
          </p>
        </div>

        {/* Link Columns */}
        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <h4
              style={{
                color: "var(--text-primary)",
                fontWeight: 700,
                fontSize: "0.9rem",
                marginBottom: "1rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {title}
            </h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {links.map((link) => (
                <li key={link.label} style={{ marginBottom: "0.5rem" }}>
                  <Link
                    href={link.href}
                    style={{
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      fontSize: "0.85rem",
                      transition: "color 0.2s ease",
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "3rem auto 0",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          © {new Date().getFullYear()} EventAI. All rights reserved.
        </p>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {["Twitter", "GitHub", "LinkedIn"].map((social) => (
            <a
              key={social}
              href="#"
              style={{
                color: "var(--text-muted)",
                textDecoration: "none",
                fontSize: "0.8rem",
                transition: "color 0.2s ease",
              }}
            >
              {social}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
