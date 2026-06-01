import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  Filter,
  Heart,
  Ticket,
  Activity,
  Lock,
  Mic,
  Laptop,
  Video,
  Music,
  Trophy,
  Users,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Filter,
    title: "Smart Filters",
    desc: "Find precisely what you need by filtering events by category, date, or price range.",
  },
  {
    icon: Heart,
    title: "Curated Picks",
    desc: "Browse handpicked selections and popular upcoming campus gatherings.",
  },
  {
    icon: Ticket,
    title: "Seamless Ticketing",
    desc: "Instantly register and receive secure digital passes with automatic QR generation.",
  },
  {
    icon: Lock,
    title: "Secure Checkout",
    desc: "Complete paid bookings securely using integrated Razorpay checkouts or sandboxes.",
  },
  {
    icon: Activity,
    title: "Real-time Analytics",
    desc: "Live dashboard monitoring attendee registrations and revenue metrics.",
  },
  {
    icon: Users,
    title: "Collaborative Events",
    desc: "Create and coordinate speaker lists, sub-events, and roles effortlessly.",
  },
];

const stats = [
  { value: "10K+", label: "Events Created" },
  { value: "50K+", label: "Tickets Booked" },
  { value: "Instant", label: "Digital Passes" },
  { value: "4.9★", label: "User Rating" },
];

// Hardcoded stats remain static

export default async function Home() {
  const user = await getSessionUser();

  // Fetch real counts for categories using highly optimized native groupBy aggregation
  const categoryCounts = await prisma.event.groupBy({
    by: ['category'],
    _count: {
      _all: true,
    },
  });

  const countsMap = categoryCounts.reduce((acc, curr) => {
    acc[curr.category] = curr._count._all;
    return acc;
  }, {} as Record<string, number>);

  const categories = [
    { name: "Conferences", dbName: "CONFERENCE", icon: Mic },
    { name: "Workshops", dbName: "WORKSHOP", icon: Laptop },
    { name: "Webinars", dbName: "WEBINAR", icon: Video },
    { name: "Concerts", dbName: "CONCERT", icon: Music },
    { name: "Sports", dbName: "SPORTS", icon: Trophy },
    { name: "Networking", dbName: "NETWORKING", icon: Users },
  ];

  return (
    <>
      {/* ─── Hero Section ─────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          overflow: "hidden",
          padding: "2rem 1.5rem",
        }}
      >
        {/* Decorative Orbs */}
        <div
          className="glow-orb glow-orb-primary animate-float"
          style={{
            width: "500px",
            height: "500px",
            top: "-150px",
            right: "-100px",
          }}
        />
        <div
          className="glow-orb glow-orb-secondary animate-float"
          style={{
            width: "400px",
            height: "400px",
            bottom: "-100px",
            left: "-80px",
            animationDelay: "2s",
          }}
        />
        <div
          className="glow-orb glow-orb-pink animate-float"
          style={{
            width: "300px",
            height: "300px",
            top: "40%",
            left: "60%",
            animationDelay: "4s",
          }}
        />

        <div
          style={{ position: "relative", zIndex: 1, maxWidth: "800px" }}
          className="animate-fade-in-up"
        >
          <div
            className="badge badge-primary"
            style={{ marginBottom: "1.5rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Sparkles size={12} /> The Premier Campus Event Platform
          </div>
          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "1.5rem",
            }}
          >
            Discover & Create{" "}
            <span className="gradient-text">Unforgettable Events</span>
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              color: "var(--text-secondary)",
              maxWidth: "600px",
              margin: "0 auto 2.5rem",
              lineHeight: 1.7,
            }}
          >
            Create, discover, and manage campus events with real-time ticketing,
            dashboard analytics, and secure checkout options.
          </p>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link href="/events" className="btn-primary">
              Explore Events →
            </Link>
            {!user && (
              <Link href="/dashboard" className="btn-secondary">
                Organize an Event
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─── Stats Section ─────────────────────────────────────── */}
      <section
        style={{
          padding: "2rem 1.5rem",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div
          className="glass animate-fade-in-up"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px",
            background: "var(--border-color)",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className="stat-card"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Section ──────────────────────────────────── */}
      <section className="section" id="features">
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div
            className="badge badge-primary"
            style={{ marginBottom: "1rem" }}
          >
            Features
          </div>
          <h2 className="section-title">
            Intelligent Tools for{" "}
            <span className="gradient-text">Modern Events</span>
          </h2>
          <p
            className="section-subtitle"
            style={{ margin: "0.75rem auto 0" }}
          >
            Every feature is designed to save time, boost engagement, and deliver
            data-driven insights.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {features.map((feature, i) => (
            <div
              key={i}
              className="glass glass-hover animate-fade-in-up"
              style={{
                padding: "2rem",
                animationDelay: `${i * 100}ms`,
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(99, 102, 241, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <feature.icon size={24} style={{ color: "var(--accent-primary)" }} />
              </div>
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  marginBottom: "0.5rem",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  lineHeight: 1.7,
                }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Categories Section ────────────────────────────────── */}
      <section className="section">
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div
            className="badge badge-primary"
            style={{ marginBottom: "1rem" }}
          >
            Categories
          </div>
          <h2 className="section-title">
            Browse by <span className="gradient-text">Category</span>
          </h2>
          <p
            className="section-subtitle"
            style={{ margin: "0.75rem auto 0" }}
          >
            Find the perfect event type that matches your interests.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "1rem",
          }}
        >
          {categories.map((cat, i) => {
            const count = countsMap[cat.dbName] || 0;
            return (
              <Link
                href={`/events?category=${cat.dbName}`}
                key={i}
                className="glass glass-hover"
                style={{
                  padding: "1.75rem 1.25rem",
                  textAlign: "center",
                  textDecoration: "none",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                  <cat.icon size={32} style={{ color: "var(--accent-primary)" }} />
                </div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "0.25rem",
                  }}
                >
                  {cat.name}
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                  }}
                >
                  {count} {count === 1 ? "event" : "events"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          padding: "6rem 1.5rem",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <div
          className="glow-orb glow-orb-primary"
          style={{
            width: "600px",
            height: "600px",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 900,
              lineHeight: 1.2,
              marginBottom: "1rem",
              letterSpacing: "-0.02em",
            }}
          >
            Ready to Transform Your{" "}
            <span className="gradient-text">Events?</span>
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "1.1rem",
              maxWidth: "500px",
              margin: "0 auto 2.5rem",
            }}
          >
            Join thousands of organizers who plan and manage unforgettable
            experiences effortlessly.
          </p>
          <Link
            href="/auth/signup"
            className="btn-primary animate-pulse-glow"
            style={{
              padding: "1rem 2.5rem",
              fontSize: "1rem",
            }}
          >
            Get Started for Free
          </Link>
        </div>
      </section>
    </>
  );
}
