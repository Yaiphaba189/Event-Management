"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Ticket } from "lucide-react";

interface ManagedEvent {
  id: string;
  title: string;
  date: Date | string;
  capacity: number;
  price: number;
  _count: {
    tickets: number;
  };
}

interface ManagedEventsListProps {
  initialEvents: ManagedEvent[];
}

// Hydration-safe static date formatter to avoid server-client locale mismatches
const formatDate = (dateInput: Date | string) => {
  const d = new Date(dateInput);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};

export default function ManagedEventsList({ initialEvents }: ManagedEventsListProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event? This will also cancel all booked tickets.")) {
      return;
    }

    setDeletingId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete event");
      }
    } catch (error) {
      console.error("Delete event failed:", error);
      alert("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {events.map((event, i) => (
        <div
          key={event.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 0",
            borderBottom: i < events.length - 1 ? "1px solid var(--border-color)" : "none",
          }}
        >
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.25rem" }}>
              {event.title}
            </h3>
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "var(--text-muted)", alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <Calendar size={12} /> {formatDate(event.date)}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <Ticket size={12} /> {event._count.tickets}/{event.capacity} registered students
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ textAlign: "right" }}>
              <span
                className={`badge ${
                  new Date(event.date) > new Date() ? "badge-primary" : "badge-success"
                }`}
                style={{ fontSize: "0.65rem" }}
              >
                {new Date(event.date) > new Date() ? "UPCOMING" : "COMPLETED"}
              </span>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "var(--text-accent)",
                  marginTop: "0.25rem",
                }}
              >
                {event.price === 0 ? "Free" : `₹${(event._count.tickets * event.price).toLocaleString()}`}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link
                href={`/dashboard/edit/${event.id}`}
                style={{
                  background: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  borderRadius: "6px",
                  color: "var(--text-accent)",
                  fontSize: "0.75rem",
                  padding: "0.3rem 0.75rem",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                }}
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(event.id)}
                disabled={deletingId === event.id}
                style={{
                  background: "rgba(248, 113, 113, 0.1)",
                  border: "1px solid rgba(248, 113, 113, 0.2)",
                  borderRadius: "6px",
                  color: "#f87171",
                  fontSize: "0.75rem",
                  padding: "0.3rem 0.75rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  opacity: deletingId === event.id ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (deletingId !== event.id) e.currentTarget.style.background = "rgba(248, 113, 113, 0.2)";
                }}
                onMouseLeave={(e) => {
                  if (deletingId !== event.id) e.currentTarget.style.background = "rgba(248, 113, 113, 0.1)";
                }}
              >
                {deletingId === event.id ? "..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ))}

      {events.length === 0 && (
        <div style={{ padding: "2rem 0", textAlign: "center", color: "var(--text-muted)" }}>
          No events created yet. Get started by clicking "+ Create Campus Event"!
        </div>
      )}
    </div>
  );
}
