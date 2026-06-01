import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import ManagedEventsList from "@/components/dashboard/ManagedEventsList";
import OrganizerApprovalPanel from "@/components/dashboard/OrganizerApprovalPanel";
import TicketVerifierPanel from "@/components/dashboard/TicketVerifierPanel";
import {
  Calendar,
  Ticket,
  IndianRupee,
  Star,
} from "lucide-react";

export default async function DashboardPage() {
  const sessionUser = await getSessionUser();
  const organizer = sessionUser
    ? await prisma.user.findUnique({ where: { id: sessionUser.id } })
    : await prisma.user.findFirst({ where: { role: "ORGANIZER" } });

  const isAdmin = sessionUser?.role === "ADMIN";

  const events = await prisma.event.findMany({
    where: isAdmin ? {} : { organizerId: organizer?.id },
    include: {
      _count: {
        select: { tickets: true },
      },
      feedbacks: true,
      organizer: {
        select: { name: true }
      }
    },
    orderBy: {
      date: "asc",
    },
  });

  // Calculate dynamic breakdowns
  const now = new Date();
  const upcomingEventsCount = events.filter(e => new Date(e.date) > now).length;
  const liveEventsCount = events.filter(e => new Date(e.date) <= now && (!e.endDate || new Date(e.endDate) >= now)).length;
  const closedEventsCount = events.filter(e => new Date(e.endDate || e.date) < now).length;

  // 2. Compute live metrics
  const totalEvents = events.length;
  const ticketsSold = events.reduce((sum, e) => sum + e._count.tickets, 0);

  // Fetch completed payments dynamically
  const completedPayments = await prisma.payment.findMany({
    where: isAdmin 
      ? { status: "COMPLETED" } 
      : { status: "COMPLETED", event: { organizerId: organizer?.id } },
    select: { amount: true },
  });
  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  // Fetch recent payments for dashboard feed
  const recentPayments = await prisma.payment.findMany({
    where: isAdmin 
      ? {} 
      : { event: { organizerId: organizer?.id } },
    include: {
      user: { select: { name: true, email: true } },
      event: { select: { title: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // Collect feedbacks across all organizer events
  const feedbacks = await prisma.feedback.findMany({
    include: { event: true },
  });

  const avgRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : "4.8";



  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>
            Campus <span className="gradient-text">Organizer Dashboard</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Welcome back, {organizer?.name || "Organizer"}! Manage campus registrations and ML insights.
          </p>
        </div>
        <Link href="/dashboard/create" className="btn-primary" style={{ textDecoration: "none" }}>
          + Create Campus Event
        </Link>
      </div>

      {/* Status Breakdown Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="glass animate-fade-in-up" style={{ padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: "4px solid #34d399" }}>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600 }}>Live Events</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.15rem", color: "#34d399" }}>{liveEventsCount}</div>
          </div>
          <span style={{ fontSize: "0.7rem", background: "rgba(52, 211, 153, 0.1)", color: "#34d399", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)" }}>Ongoing</span>
        </div>

        <div className="glass animate-fade-in-up" style={{ padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: "4px solid var(--accent-primary)", animationDelay: "80ms" }}>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600 }}>Upcoming Events</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.15rem", color: "var(--accent-primary)" }}>{upcomingEventsCount}</div>
          </div>
          <span style={{ fontSize: "0.7rem", background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-primary)", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)" }}>Scheduled</span>
        </div>

        <div className="glass animate-fade-in-up" style={{ padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: "4px solid var(--text-muted)", animationDelay: "160ms" }}>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600 }}>Closed Events</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.15rem", color: "var(--text-muted)" }}>{closedEventsCount}</div>
          </div>
          <span style={{ fontSize: "0.7rem", background: "rgba(160, 163, 189, 0.1)", color: "var(--text-muted)", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)" }}>Completed</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="glass glass-hover animate-fade-in-up" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 500 }}>
              Total Campus Events
            </span>
            <Calendar size={18} style={{ color: "var(--accent-primary)" }} />
          </div>
          <div className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.25rem" }}>
            {totalEvents}
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Created on portal</span>
        </div>

        <div className="glass glass-hover animate-fade-in-up" style={{ padding: "1.5rem", animationDelay: "80ms" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 500 }}>
              Registrations Secured
            </span>
            <Ticket size={18} style={{ color: "var(--accent-primary)" }} />
          </div>
          <div className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.25rem" }}>
            {ticketsSold}
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Total active passes</span>
        </div>

        <div className="glass glass-hover animate-fade-in-up" style={{ padding: "1.5rem", animationDelay: "160ms" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 500 }}>
              Event Revenue
            </span>
            <IndianRupee size={18} style={{ color: "var(--accent-primary)" }} />
          </div>
          <div className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.25rem" }}>
            ₹{totalRevenue}
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>From completed gateway entries</span>
        </div>

        <div className="glass glass-hover animate-fade-in-up" style={{ padding: "1.5rem", animationDelay: "240ms" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 500 }}>
              Student Rating
            </span>
            <Star size={18} style={{ color: "var(--accent-primary)" }} />
          </div>
          <div className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.25rem" }}>
            {avgRating}
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Average feedback score</span>
        </div>
      </div>

      {isAdmin && <OrganizerApprovalPanel />}

      {/* Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Recent Events & Recent Gateway Transactions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", gridColumn: "1 / -1" }}>
          {/* Ticket Verification & Entry Gate Control */}
          <TicketVerifierPanel />

          {/* Managed Events List */}
          <div className="glass" style={{ padding: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>My Managed Events</h2>
              <Link
                href="/events"
                style={{ color: "var(--text-accent)", fontSize: "0.85rem", textDecoration: "none" }}
              >
                Public View →
              </Link>
            </div>

            <ManagedEventsList initialEvents={events} />
          </div>

          {/* Gateway Transactions Feed */}
          <div className="glass" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem" }}>
              Recent Gateway Transactions
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Student</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Event Title</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Amount</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((pay, idx) => {
                    let statusColor = "var(--text-muted)";
                    let statusBg = "rgba(255,255,255,0.05)";
                    if (pay.status === "COMPLETED") {
                      statusColor = "var(--success)";
                      statusBg = "rgba(52, 211, 153, 0.1)";
                    } else if (pay.status === "REFUNDED") {
                      statusColor = "#818cf8";
                      statusBg = "rgba(99, 102, 241, 0.1)";
                    } else if (pay.status === "FAILED") {
                      statusColor = "var(--error)";
                      statusBg = "rgba(248, 113, 113, 0.1)";
                    } else if (pay.status === "PENDING") {
                      statusColor = "#f59e0b";
                      statusBg = "rgba(245, 158, 11, 0.1)";
                    }

                    return (
                      <tr key={pay.id} style={{ borderBottom: idx < recentPayments.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <div style={{ fontWeight: 600 }}>{pay.user.name || "Attendee"}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{pay.user.email}</div>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", color: "var(--text-secondary)" }}>
                          {pay.event.title}
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>
                          ₹{pay.amount}
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <span style={{ padding: "0.15rem 0.4rem", borderRadius: "var(--radius-full)", fontSize: "0.65rem", fontWeight: 700, color: statusColor, background: statusBg, textTransform: "uppercase" }}>
                            {pay.status}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                          {new Date(pay.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    );
                  })}
                  {recentPayments.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        No transactions registered on the campus gateway yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
