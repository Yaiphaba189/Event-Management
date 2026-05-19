"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, CheckCircle2, AlertTriangle } from "lucide-react";

interface BookingSidebarProps {
  eventId: string;
  price: number;
  capacity: number;
  initialTicketsSold: number;
  date: string;
  location: string;
  organizerName: string;
}

export default function BookingSidebar({
  eventId,
  price,
  capacity,
  initialTicketsSold,
  date,
  location,
  organizerName,
}: BookingSidebarProps) {
  const router = useRouter();
  const [ticketsSold, setTicketsSold] = useState(initialTicketsSold);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<{
    success: boolean;
    message: string;
    ticketNo?: string;
  } | null>(null);

  const handleBook = async () => {
    setIsLoading(true);
    setBookingStatus(null);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();
      if (res.ok) {
        setBookingStatus({
          success: true,
          message: "Ticket successfully booked! See you at the event.",
          ticketNo: data.ticket.ticketNo,
        });
        setTicketsSold((prev) => prev + 1);
        router.refresh();
      } else {
        setBookingStatus({
          success: false,
          message: data.error || "Failed to book ticket.",
        });
      }
    } catch {
      setBookingStatus({
        success: false,
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progress = capacity > 0 ? (ticketsSold / capacity) * 100 : 0;
  const isSoldOut = ticketsSold >= capacity;

  return (
    <div
      className="glass"
      style={{
        padding: "2rem",
        position: "sticky",
        top: "90px",
      }}
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Registration Fee</span>
        <div className="gradient-text" style={{ fontSize: "2.5rem", fontWeight: 900 }}>
          {price === 0 ? "Free" : `₹${price}`}
        </div>
      </div>

      {/* Capacity Progress Bar */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            marginBottom: "0.5rem",
          }}
        >
          <span>{ticketsSold} registered</span>
          <span>{capacity - ticketsSold} spots left</span>
        </div>
        <div
          style={{
            height: "8px",
            borderRadius: "var(--radius-full)",
            background: "rgba(255, 255, 255, 0.05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: "var(--radius-full)",
              background: "var(--accent-gradient)",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Details Box */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          marginBottom: "2rem",
          padding: "1.25rem",
          background: "rgba(99, 102, 241, 0.05)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Date</span>
          <span style={{ fontWeight: 600 }}>
            {new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Location</span>
          <span style={{ fontWeight: 600, maxWidth: "160px", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {location}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Organized by</span>
          <span style={{ fontWeight: 600, maxWidth: "160px", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {organizerName}
          </span>
        </div>
      </div>

      {/* Success/Error Message */}
      {bookingStatus && (
        <div
          style={{
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
            background: bookingStatus.success ? "rgba(52, 211, 153, 0.1)" : "rgba(248, 113, 113, 0.1)",
            border: `1px solid ${bookingStatus.success ? "rgba(52, 211, 153, 0.2)" : "rgba(248, 113, 113, 0.2)"}`,
            color: bookingStatus.success ? "var(--success)" : "var(--error)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            {bookingStatus.success ? (
              <>
                <CheckCircle2 size={16} /> Success!
              </>
            ) : (
              <>
                <AlertTriangle size={16} /> Registration Failed
              </>
            )}
          </div>
          <div>{bookingStatus.message}</div>
          {bookingStatus.ticketNo && (
            <div style={{ marginTop: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem", background: "rgba(255,255,255,0.05)", padding: "0.4rem", borderRadius: "4px", display: "inline-block" }}>
              Ticket No: {bookingStatus.ticketNo}
            </div>
          )}
        </div>
      )}

      {/* CTA Button */}
      {bookingStatus?.success ? (
        <button
          onClick={() => router.push("/tickets")}
          className="btn-secondary"
          style={{ width: "100%", padding: "1rem", fontSize: "1rem", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
        >
          <Ticket size={18} /> View My Ticket
        </button>
      ) : (
        <button
          onClick={handleBook}
          disabled={isLoading || isSoldOut}
          className={`btn-primary ${!isSoldOut && !isLoading ? "animate-pulse-glow" : ""}`}
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1rem",
            fontWeight: 700,
            opacity: isLoading || isSoldOut ? 0.6 : 1,
            cursor: isLoading || isSoldOut ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          {isLoading ? (
            "Registering..."
          ) : isSoldOut ? (
            "Sold Out"
          ) : (
            <>
              <Ticket size={18} /> Register Now
            </>
          )}
        </button>
      )}

      <p
        style={{
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "0.75rem",
          marginTop: "0.75rem",
        }}
      >
        Instant confirmation • Digital pass generated
      </p>
    </div>
  );
}
