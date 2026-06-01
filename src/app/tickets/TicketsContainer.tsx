"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Calendar, 
  MapPin, 
  Building, 
  Ticket, 
  FileText, 
  AlertTriangle, 
  X, 
  CheckCircle,
  Clock,
  Printer,
  ChevronRight,
  RefreshCcw,
  BadgeCent
} from "lucide-react";

interface EventData {
  id: string;
  title: string;
  price: number;
  date: string | Date;
  location: string;
  venue: string | null;
  category: string;
}

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  createdAt: string | Date;
}

interface TicketWithRelations {
  id: string;
  ticketNo: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "USED";
  attended: boolean;
  createdAt: string | Date;
  event: EventData;
  payment: PaymentData | null;
}

interface TicketsContainerProps {
  initialTickets: TicketWithRelations[];
  studentName: string;
  studentEmail: string;
}

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", label: "Pending" },
  CONFIRMED: { bg: "rgba(52, 211, 153, 0.15)", color: "#34d399", label: "Confirmed" },
  CANCELLED: { bg: "rgba(248, 113, 113, 0.15)", color: "#f87171", label: "Cancelled" },
  USED: { bg: "rgba(160, 163, 189, 0.15)", color: "#a0a3bd", label: "Used" },
};

const payStatusConfig: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", label: "Pending" },
  COMPLETED: { bg: "rgba(52, 211, 153, 0.15)", color: "#34d399", label: "Completed" },
  FAILED: { bg: "rgba(248, 113, 113, 0.15)", color: "#f87171", label: "Failed" },
  REFUNDED: { bg: "rgba(99, 102, 241, 0.15)", color: "#818cf8", label: "Refunded" },
};

export default function TicketsContainer({ 
  initialTickets, 
  studentName, 
  studentEmail 
}: TicketsContainerProps) {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketWithRelations[]>(initialTickets);
  const [activeTab, setActiveTab] = useState<"passes" | "billing">("passes");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  // Invoice Modal State
  const [invoiceTicket, setInvoiceTicket] = useState<TicketWithRelations | null>(null);

  const handleCancelTicket = async (ticketId: string, isPaid: boolean) => {
    const confirmMessage = isPaid
      ? "Are you sure you want to cancel this event ticket? A full refund will be processed back to your payment source."
      : "Are you sure you want to cancel this registration?";
      
    if (!confirm(confirmMessage)) return;

    setCancellingId(ticketId);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/cancel`, {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok) {
        // Update ticket in local state
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status: "CANCELLED",
                  payment: t.payment ? { ...t.payment, status: t.payment.status === "COMPLETED" ? "REFUNDED" : "FAILED" } : null,
                }
              : t
          )
        );
        alert(data.message || "Registration cancelled successfully.");
        router.refresh();
      } else {
        alert(data.error || "Failed to cancel registration");
      }
    } catch (err) {
      console.error("Cancel ticket request error:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  const activePasses = tickets.filter(t => t.status === "CONFIRMED" || t.status === "USED");
  const billingList = tickets.filter(t => t.payment !== null);

  const formatDate = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Tab Switcher */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--border-color)",
          padding: "0.4rem",
          borderRadius: "12px",
          marginBottom: "2rem",
          maxWidth: "360px",
        }}
      >
        <button
          onClick={() => setActiveTab("passes")}
          style={{
            flex: 1,
            padding: "0.6rem 1rem",
            background: activeTab === "passes" ? "var(--accent-gradient)" : "transparent",
            color: activeTab === "passes" ? "#fff" : "var(--text-secondary)",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
          }}
        >
          <Ticket size={16} /> My Passes ({activePasses.length})
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          style={{
            flex: 1,
            padding: "0.6rem 1rem",
            background: activeTab === "billing" ? "var(--accent-gradient)" : "transparent",
            color: activeTab === "billing" ? "#fff" : "var(--text-secondary)",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
          }}
        >
          <FileText size={16} /> Receipts & Billing ({billingList.length})
        </button>
      </div>

      {/* Passes View */}
      {activeTab === "passes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {activePasses.map((ticket, i) => {
            const status = statusConfig[ticket.status] || statusConfig.CONFIRMED;
            const isPaid = !!ticket.payment;
            return (
              <div
                key={ticket.id}
                className="glass glass-hover animate-fade-in-up"
                style={{
                  display: "flex",
                  overflow: "hidden",
                  animationDelay: `${i * 80}ms`,
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                {/* Accent strip based on status */}
                <div style={{ width: "6px", background: status.color, flexShrink: 0 }} />

                <div
                  style={{
                    flex: 1,
                    padding: "1.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Left Column - Ticket Info */}
                  <div style={{ flex: 1, minWidth: "250px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>{ticket.event.title}</h3>
                      <span
                        style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "var(--radius-full)",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          background: status.bg,
                          color: status.color,
                          textTransform: "uppercase",
                        }}
                      >
                        {status.label}
                      </span>
                      {isPaid && (
                        <span
                          style={{
                            padding: "0.2rem 0.6rem",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            background: "rgba(99, 102, 241, 0.15)",
                            color: "var(--text-accent)",
                          }}
                        >
                          PAID - ₹{ticket.event.price}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "1.5rem", color: "var(--text-muted)", fontSize: "0.8rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <Calendar size={12} /> {formatDate(ticket.event.date)}
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
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <Link
                        href={`/events/${ticket.event.id}`}
                        className="btn-secondary"
                        style={{ padding: "0.4rem 1rem", fontSize: "0.75rem", textDecoration: "none", display: "inline-block" }}
                      >
                        View Event Detail
                      </Link>
                      {isPaid && ticket.payment?.status === "COMPLETED" && (
                        <button
                          onClick={() => setInvoiceTicket(ticket)}
                          className="btn-secondary"
                          style={{
                            padding: "0.4rem 1rem",
                            fontSize: "0.75rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            background: "rgba(99,102,241,0.08)",
                            borderColor: "rgba(99,102,241,0.15)"
                          }}
                        >
                          <FileText size={12} /> Digital Invoice
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Cancel & Pass Numbers */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: "0.8rem",
                        color: "var(--text-accent)",
                        fontWeight: 600,
                        padding: "0.4rem 0.75rem",
                        background: "rgba(99, 102, 241, 0.08)",
                        borderRadius: "var(--radius-sm)",
                        display: "inline-block",
                      }}
                    >
                      PASS: {ticket.ticketNo}
                    </div>
                    {ticket.status === "CONFIRMED" && (
                      ticket.attended ? (
                        <span style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.2rem", padding: "0.3rem 0.5rem" }}>
                          ✓ Checked In
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCancelTicket(ticket.id, isPaid)}
                          disabled={cancellingId === ticket.id}
                          style={{
                            background: "transparent",
                            border: "1px solid rgba(248, 113, 113, 0.2)",
                            color: "#f87171",
                            borderRadius: "6px",
                            padding: "0.3rem 0.75rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(248,113,113,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {cancellingId === ticket.id ? "Processing..." : "Cancel Pass"}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {activePasses.length === 0 && (
            <div className="glass" style={{ padding: "4rem 2rem", textAlign: "center" }}>
              <Ticket size={48} style={{ color: "var(--text-muted)", marginBottom: "1.25rem", margin: "0 auto" }} />
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>No active passes found</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                Browse upcoming campus activities and secure your digital entry passes.
              </p>
              <Link href="/events" className="btn-primary" style={{ textDecoration: "none" }}>
                Explore Events
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Receipts & Billing View */}
      {activeTab === "billing" && (
        <div className="glass" style={{ padding: "1.5rem", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                <th style={{ padding: "1rem" }}>Event Description</th>
                <th style={{ padding: "1rem" }}>Date Purchased</th>
                <th style={{ padding: "1rem" }}>Transaction ID</th>
                <th style={{ padding: "1rem" }}>Amount Paid</th>
                <th style={{ padding: "1rem" }}>Gateway Status</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {billingList.map((ticket, i) => {
                const pay = ticket.payment!;
                const payStatus = payStatusConfig[pay.status] || payStatusConfig.PENDING;
                return (
                  <tr key={ticket.id} style={{ borderBottom: i < billingList.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600 }}>{ticket.event.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ticket.event.category} pass</div>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                      {formatDate(pay.createdAt)}
                    </td>
                    <td style={{ padding: "1rem", fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {pay.razorpayPaymentId || pay.razorpayOrderId}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 700 }}>
                      ₹{pay.amount}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          padding: "0.15rem 0.5rem",
                          borderRadius: "var(--radius-full)",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          background: payStatus.bg,
                          color: payStatus.color,
                        }}
                      >
                        {payStatus.label}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      {pay.status === "COMPLETED" && (
                        <button
                          onClick={() => setInvoiceTicket(ticket)}
                          className="btn-secondary"
                          style={{
                            padding: "0.35rem 0.75rem",
                            fontSize: "0.75rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <FileText size={12} /> View Receipt
                        </button>
                      )}
                      {pay.status === "REFUNDED" && (
                        <button
                          onClick={() => setInvoiceTicket(ticket)}
                          className="btn-secondary"
                          style={{
                            padding: "0.35rem 0.75rem",
                            fontSize: "0.75rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <RefreshCcw size={12} /> Refund Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {billingList.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                    No payment history or billing logs recorded on your student account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 📄 DIGITAL INVOICE RECEIPT MODAL */}
      {invoiceTicket && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(10, 11, 30, 0.85)",
            backdropFilter: "blur(18px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
          }}
        >
          <div
            className="glass animate-fade-in-up print-target"
            style={{
              maxWidth: "580px",
              width: "100%",
              borderRadius: "20px",
              padding: "2.5rem",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
              color: "#fff",
              position: "relative"
            }}
          >
            {/* Modal Actions */}
            <div className="no-print" style={{ position: "absolute", top: "1.25rem", right: "1.25rem", display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => window.print()}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
                title="Print Receipt"
              >
                <Printer size={16} />
              </button>
              <button
                onClick={() => setInvoiceTicket(null)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Bill Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.01em", margin: 0 }}>
                  EVENTLY <span className="gradient-text">INVOICE</span>
                </h2>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>University Campus Secure E-Receipt</span>
              </div>
              <div style={{ textAlign: "right" }}>
                {invoiceTicket.payment?.status === "REFUNDED" ? (
                  <span style={{ background: "rgba(129, 138, 248, 0.15)", color: "#818cf8", fontSize: "0.7rem", fontWeight: 800, padding: "0.3rem 0.8rem", borderRadius: "4px", textTransform: "uppercase" }}>
                    Refunded
                  </span>
                ) : (
                  <span style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34d399", fontSize: "0.7rem", fontWeight: 800, padding: "0.3rem 0.8rem", borderRadius: "4px", textTransform: "uppercase" }}>
                    PAID
                  </span>
                )}
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                  Receipt: {invoiceTicket.ticketNo}
                </div>
              </div>
            </div>

            {/* Billing details grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.8rem", marginBottom: "2rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, marginBottom: "0.25rem" }}>Billed To:</span>
                <strong style={{ fontSize: "0.9rem" }}>{studentName}</strong>
                <div style={{ color: "var(--text-secondary)" }}>{studentEmail}</div>
                <div style={{ color: "var(--text-muted)" }}>Campus Student Registrant</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, marginBottom: "0.25rem" }}>Payment Details:</span>
                <div>Date: {invoiceTicket.payment ? formatDateTime(invoiceTicket.payment.createdAt) : "N/A"}</div>
                <div>Method: Razorpay Online</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                  Order: {invoiceTicket.payment?.razorpayOrderId}
                </div>
                {invoiceTicket.payment?.razorpayPaymentId && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                    Txn: {invoiceTicket.payment.razorpayPaymentId}
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ margin: "1.5rem 0", background: "rgba(255,255,255,0.02)", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1.25fr", padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>
                <span>Item / Event Category</span>
                <span style={{ textAlign: "center" }}>Qty</span>
                <span style={{ textAlign: "right" }}>Amount</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1.25fr", padding: "1rem", fontSize: "0.85rem", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <div>
                  <strong style={{ color: "#fff", display: "block" }}>{invoiceTicket.event.title} Entry Pass</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Format: {invoiceTicket.event.category}</span>
                </div>
                <span style={{ textAlign: "center" }}>1</span>
                <span style={{ textAlign: "right", fontWeight: 700 }}>₹{(invoiceTicket.event.price * 0.82).toFixed(2)}</span>
              </div>

              {/* Subtotal, Cess & Grand Total */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Subtotal (Excl. Tax)</span>
                  <span>₹{(invoiceTicket.event.price * 0.82).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Campus Event SGST / CGST (18%)</span>
                  <span>₹{(invoiceTicket.event.price * 0.18).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem", fontWeight: 800, fontSize: "1rem", color: "#fff" }}>
                  <span>{invoiceTicket.payment?.status === "REFUNDED" ? "Refunded Amount" : "Total Amount Paid"}</span>
                  <span className="gradient-text">₹{invoiceTicket.event.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Trust Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <BadgeCent size={16} style={{ color: "var(--success)" }} />
                <span>Verified by Campus Gateway</span>
              </div>
              <div>Thank you for registering!</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
