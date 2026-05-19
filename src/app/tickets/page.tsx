import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Calendar, MapPin, Building, Ticket } from "lucide-react";
import { getSessionUser } from "@/lib/session";

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  CONFIRMED: { bg: "rgba(52, 211, 153, 0.15)", color: "#34d399", label: "Confirmed" },
  CANCELLED: { bg: "rgba(248, 113, 113, 0.15)", color: "#f87171", label: "Cancelled" },
  USED: { bg: "rgba(160, 163, 189, 0.15)", color: "#a0a3bd", label: "Used" },
};

export default async function TicketsPage() {
  const sessionUser = await getSessionUser();
  const student = sessionUser && sessionUser.role === "ATTENDEE"
    ? await prisma.user.findUnique({ where: { id: sessionUser.id } })
    : await prisma.user.findFirst({ where: { role: "ATTENDEE" } });

  const tickets = student
    ? await prisma.ticket.findMany({
        where: { userId: student.id },
        include: {
          event: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    : [];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>
          My <span className="gradient-text">Tickets & Passes</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Manage your campus event registrations and check-in codes.
        </p>
      </div>

      {/* Tickets List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {tickets.map((ticket, i) => {
          const status = statusConfig[ticket.status] || statusConfig.CONFIRMED;
          return (
            <div
              key={ticket.id}
              className="glass glass-hover animate-fade-in-up"
              style={{
                display: "flex",
                overflow: "hidden",
                animationDelay: `${i * 100}ms`,
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              {/* Left Accent */}
              <div
                style={{
                  width: "6px",
                  background: status.color,
                  flexShrink: 0,
                }}
              />

              <div
                style={{
                  flex: 1,
                  padding: "1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                {/* Info */}
                <div style={{ flex: 1, minWidth: "250px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                      {ticket.event.title}
                    </h3>
                    <span
                      style={{
                        padding: "0.2rem 0.6rem",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        background: status.bg,
                        color: status.color,
                        textTransform: "uppercase",
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "1.5rem",
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <Calendar size={12} />
                      {new Date(ticket.event.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <MapPin size={12} /> {ticket.event.location}
                    </span>
                    {ticket.event.venue && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <Building size={12} /> {ticket.event.venue}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ticket Number & QR */}
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "0.8rem",
                      color: "var(--text-accent)",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                      padding: "0.4rem 0.75rem",
                      background: "rgba(99, 102, 241, 0.08)",
                      borderRadius: "var(--radius-sm)",
                      display: "inline-block",
                    }}
                  >
                    {ticket.ticketNo}
                  </div>
                  <div>
                    <Link
                      href={`/events/${ticket.eventId}`}
                      className="btn-secondary"
                      style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", textDecoration: "none", display: "inline-block" }}
                    >
                      View Event
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {tickets.length === 0 && (
        <div
          className="glass"
          style={{ padding: "4rem 2rem", textAlign: "center" }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
            <Ticket size={48} style={{ color: "var(--text-muted)" }} />
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            No registered passes
          </h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Browse upcoming campus activities and secure your spot today!
          </p>
          <Link href="/events" className="btn-primary" style={{ textDecoration: "none" }}>
            Explore Events
          </Link>
        </div>
      )}
    </div>
  );
}
