"use client";

import { useState } from "react";
import {
  Search,
  CheckCircle2,
  UserCheck,
  Calendar,
  Ticket,
  Loader2,
  X,
} from "lucide-react";

interface TicketData {
  id: string;
  ticketNo: string;
  status: string;
  attended: boolean;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  event: {
    title: string;
    category: string;
    date: string;
    price: number;
  };
  payment?: {
    status: string;
    razorpayPaymentId: string | null;
    amount: number;
  };
}

export default function TicketVerifierPanel() {
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const res = await fetch(`/api/tickets/verify?query=${encodeURIComponent(query.trim())}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to search tickets");
      }
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while fetching tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAttendance = async (ticketId: string, currentAttended: boolean) => {
    setIsUpdating(ticketId);
    setError("");

    try {
      const res = await fetch(`/api/tickets/${ticketId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attended: !currentAttended }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update attendance");
      }

      const data = await res.json();
      if (data.success && data.ticket) {
        // Update local state reactively
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId ? { ...t, attended: data.ticket.attended } : t
          )
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not toggle attendance status");
    } finally {
      setIsUpdating(null);
    }
  };

  const formatTicketDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="glass" style={{ padding: "1.75rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
        <UserCheck size={22} style={{ color: "var(--accent-primary)" }} />
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800 }}>Campus Entry & Ticket Verifier</h2>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
            Search ticket receipt codes, student names, or emails to check-in registrants
          </span>
        </div>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            className="input"
            placeholder="Search Ticket Receipt (e.g. UNI-WOR...), Student Name, or Email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: "2.5rem" }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{
                position: "absolute",
                right: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "0.2rem",
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button type="submit" className="btn-primary" style={{ padding: "0.75rem 2rem" }} disabled={isLoading}>
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Verify Entry"}
        </button>
      </form>

      {/* Errors Panel */}
      {error && (
        <div
          style={{
            background: "rgba(248, 113, 113, 0.1)",
            border: "1px solid var(--error)",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            color: "var(--error)",
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Search Results */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
          <Loader2 size={36} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
        </div>
      ) : tickets.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {tickets.map((t) => {
            const isConfirmed = t.status === "CONFIRMED" || t.status === "USED";
            const isCancelled = t.status === "CANCELLED";
            
            // Booking Status badge colors
            let statusColor = "var(--text-muted)";
            let statusBg = "rgba(255,255,255,0.05)";
            if (isConfirmed) {
              statusColor = "var(--success)";
              statusBg = "rgba(52, 211, 153, 0.1)";
            } else if (isCancelled) {
              statusColor = "var(--error)";
              statusBg = "rgba(248, 113, 113, 0.1)";
            } else if (t.status === "PENDING") {
              statusColor = "#f59e0b";
              statusBg = "rgba(245, 158, 11, 0.1)";
            }

            return (
              <div
                key={t.id}
                className="glass"
                style={{
                  padding: "1.25rem",
                  border: t.attended
                    ? "1px solid rgba(52, 211, 153, 0.3)"
                    : "1px solid rgba(255,255,255,0.08)",
                  background: t.attended ? "rgba(52, 211, 153, 0.02)" : "rgba(255,255,255,0.01)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.3s ease",
                }}
              >
                <div>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      Receipt: {t.ticketNo}
                    </span>
                    <span
                      style={{
                        padding: "0.15rem 0.5rem",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: statusColor,
                        background: statusBg,
                        textTransform: "uppercase",
                      }}
                    >
                      {t.status}
                    </span>
                  </div>

                  {/* Student details */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <strong style={{ fontSize: "0.9rem", color: "#fff", display: "block" }}>{t.user.name}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>{t.user.email}</span>
                  </div>

                  {/* Event details */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-primary)" }}>
                      <Ticket size={12} style={{ color: "var(--accent-primary)" }} />
                      <strong style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {t.event.title}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                        <Calendar size={10} />
                        {formatTicketDate(t.event.date)}
                      </span>
                      <span>Format: {t.event.category}</span>
                    </div>
                  </div>
                </div>

                {/* Verification Control */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
                  {isUpdating === t.id ? (
                    <button className="btn-secondary" style={{ width: "100%", padding: "0.4rem", fontSize: "0.75rem" }} disabled>
                      <Loader2 size={12} className="animate-spin" /> Updating...
                    </button>
                  ) : t.attended ? (
                    <button
                      onClick={() => handleToggleAttendance(t.id, t.attended)}
                      className="btn-secondary"
                      style={{
                        width: "100%",
                        padding: "0.4rem",
                        fontSize: "0.75rem",
                        borderColor: "var(--success)",
                        background: "rgba(52, 211, 153, 0.08)",
                        color: "var(--success)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <CheckCircle2 size={12} /> Checked In (Undo)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleAttendance(t.id, t.attended)}
                      className="btn-primary"
                      style={{
                        width: "100%",
                        padding: "0.4rem 1rem",
                        fontSize: "0.75rem",
                        borderRadius: "8px",
                      }}
                      disabled={isCancelled} // Prevent check-in for cancelled bookings
                    >
                      Verify Entry & Check In
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : hasSearched ? (
        <div
          style={{
            textAlign: "center",
            padding: "2.5rem",
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            border: "1px dashed var(--border-color)",
            borderRadius: "var(--radius-md)",
            background: "rgba(255,255,255,0.01)",
          }}
        >
          <Ticket size={24} style={{ marginBottom: "0.5rem", opacity: 0.3 }} />
          <p>No tickets matched your query. Make sure the receipt code or email spelling is correct.</p>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            border: "1px dashed rgba(255,255,255,0.04)",
            borderRadius: "var(--radius-md)",
            background: "rgba(255,255,255,0.005)",
          }}
        >
          Enter a receipt code, student name, or email above to perform verification.
        </div>
      )}
    </div>
  );
}
