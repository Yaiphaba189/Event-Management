import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import TicketsContainer from "./TicketsContainer";

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
          payment: true,
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
          Manage your campus event registrations, check-in codes, and payment history.
        </p>
      </div>

      <TicketsContainer 
        initialTickets={tickets as any} 
        studentName={student?.name || "Campus Attendee"} 
        studentEmail={student?.email || "attendee@university.edu"} 
      />
    </div>
  );
}
