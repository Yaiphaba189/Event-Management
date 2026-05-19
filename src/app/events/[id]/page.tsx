import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BookingSidebar from "./BookingSidebar";
import { Calendar, MapPin, Users, Star, CalendarDays, User } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch event details
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          tickets: true,
        },
      },
    },
  });

  if (!event) {
    return notFound();
  }

  return (
    <>
      {/* Hero Banner */}
      <section
        style={{
          position: "relative",
          padding: "4rem 1.5rem",
          minHeight: "380px",
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
          backgroundImage: event.image ? `linear-gradient(to top, rgba(10, 11, 30, 1) 0%, rgba(10, 11, 30, 0.4) 100%), url(${event.image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!event.image && (
          <>
            <div
              className="glow-orb glow-orb-primary"
              style={{ width: "500px", height: "500px", top: "-200px", right: "-100px" }}
            />
            <div
              className="glow-orb glow-orb-secondary"
              style={{ width: "300px", height: "300px", bottom: "-100px", left: "10%" }}
            />
          </>
        )}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "1200px",
            margin: "0 auto",
            width: "100%",
          }}
          className="animate-fade-in-up"
        >
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <span className="badge badge-primary">{event.category}</span>
            {event.isFeatured && (
              <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <Star size={10} style={{ fill: "currentColor" }} /> Featured
              </span>
            )}
            <span className="badge badge-success">
              {event.price === 0 ? "Free" : `₹${event.price}`}
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: "1rem",
              textShadow: event.image ? "0 2px 10px rgba(0,0,0,0.5)" : "none",
            }}
          >
            {event.title}
          </h1>
          <div
            style={{
              display: "flex",
              gap: "2rem",
              color: "var(--text-secondary)",
              fontSize: "0.95rem",
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              <Calendar size={14} />
              {new Date(event.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}`}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              <MapPin size={14} />
              {event.venue ? `${event.venue}, ` : ""}{event.location}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              <Users size={14} />
              {event.capacity} capacity
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2rem 1.5rem 4rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2rem",
        }}
      >
        {/* Left Column */}
        <div style={{ gridColumn: "span 2" }}>
          {/* Sub-Events Agenda (Rendered ABOVE the main event about details) */}
          {event.subEvents && (
            <div className="glass" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CalendarDays size={20} style={{ color: "var(--accent-primary)" }} /> Sub-Events & Program Schedule
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {JSON.parse(event.subEvents).map((item: any, i: number, arr: any[]) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "1.25rem",
                      padding: "1.25rem 0",
                      borderBottom: i < arr.length - 1 ? "1px solid var(--border-color)" : "none",
                    }}
                  >
                    <span
                      style={{
                        flex: "0 0 110px",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        color: "var(--text-accent)",
                      }}
                    >
                      {item.time}
                    </span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>{item.title}</p>
                      {item.speaker && (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.2rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                          <User size={12} /> {item.speaker}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          <div className="glass" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
              About This Event
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                lineHeight: 1.8,
                whiteSpace: "pre-line",
                fontSize: "0.95rem",
              }}
            >
              {event.description}
            </p>
          </div>
        </div>

        {/* Right Column - Booking Sidebar */}
        <div style={{ gridColumn: "span 1" }}>
          <BookingSidebar
            eventId={event.id}
            price={event.price}
            capacity={event.capacity}
            initialTicketsSold={event._count.tickets}
            date={event.date.toISOString()}
            location={event.location}
            organizerName={event.organizer.name || "Campus Organizer"}
          />
        </div>
      </section>
    </>
  );
}
