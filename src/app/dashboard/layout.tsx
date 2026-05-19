import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
    redirect("/events");
  }

  // Intercept unapproved organizers with a highly descriptive, premium notice card
  if (user.role === "ORGANIZER" && !user.isApproved) {
    return (
      <div style={{ maxWidth: "600px", margin: "6rem auto 10rem", padding: "2.5rem", textAlign: "center" }} className="glass">
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              color: "#f59e0b",
              fontSize: "1.5rem",
              fontWeight: "bold"
            }}
          >
            !
          </div>
        </div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "1rem" }}>
          Registration <span className="gradient-text">Pending Approval</span>
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
          Welcome, {user.name || "Campus Organizer"}! Your organizer account registration has been received successfully.
          To maintain security and event standards, all organizer requests must be reviewed and authorized by an Administrator.
        </p>
        <div style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px dashed rgba(99, 102, 241, 0.2)", borderRadius: "8px", padding: "1.25rem", marginBottom: "2rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-accent)" }}>STATUS: PENDING ADMINISTRATIVE REVIEW</span>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Our campus administrators review accounts within 24 hours. Please refresh this page once authorization is granted.
          </p>
        </div>
        <a href="/api/auth/logout" style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", display: "inline-block", textDecoration: "none" }} className="btn-secondary">
          Sign Out
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
