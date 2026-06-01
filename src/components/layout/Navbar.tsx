"use client";

import Link from "next/link";
import { useState } from "react";
import { Zap } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Events", href: "/events" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Tickets", href: "/tickets" },
];

export default function Navbar({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const filteredLinks = navLinks.filter((link) => {
    if (!user) return true;
    if (user.role === "ATTENDEE" && link.label === "Dashboard") return false;
    if (user.role === "ORGANIZER" && link.label === "My Tickets") return false;
    return true;
  });

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(11, 13, 23, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "72px",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
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
              letterSpacing: "-0.02em",
            }}
          >
            Event<span className="gradient-text">ly</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
          className="nav-desktop"
        >
          {filteredLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "0.5rem 1rem",
                color: "var(--text-secondary)",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: 500,
                borderRadius: "var(--radius-md)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="nav-desktop">
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                {user.name} <span style={{ fontSize: "0.75rem", background: "rgba(99, 102, 241, 0.15)", color: "var(--text-accent)", padding: "0.15rem 0.4rem", borderRadius: "4px", marginLeft: "0.25rem" }}>{user.role}</span>
              </span>
              <button
                onClick={handleLogout}
                className="btn-secondary"
                style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", cursor: "pointer" }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="btn-secondary"
                style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="btn-primary"
                style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
              >
                Get Started
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "0.25rem",
            }}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            {isOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="animate-slide-down"
          style={{
            padding: "1rem 1.5rem 1.5rem",
            borderTop: "1px solid var(--border-color)",
            background: "var(--bg-secondary)",
          }}
        >
          {filteredLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              style={{
                display: "block",
                padding: "0.75rem 0",
                color: "var(--text-secondary)",
                textDecoration: "none",
                fontSize: "1rem",
                fontWeight: 500,
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <div style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
                Logged in as <strong>{user.name}</strong> ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="btn-secondary"
                style={{ width: "100%", padding: "0.6rem", fontSize: "0.9rem", cursor: "pointer" }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .nav-desktop {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}
