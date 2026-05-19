"use client";

import { useEffect, useState } from "react";
import { UserCheck, ShieldAlert, Check, X } from "lucide-react";

interface Organizer {
  id: string;
  name: string | null;
  email: string;
  isApproved: boolean;
  createdAt: string;
}

export default function OrganizerApprovalPanel() {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrganizers = async () => {
    try {
      const res = await fetch("/api/admin/organizers");
      if (res.ok) {
        const data = await res.json();
        setOrganizers(data.organizers);
      }
    } catch (error) {
      console.error("Failed to load organizers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/organizers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: !currentStatus }),
      });

      if (res.ok) {
        setOrganizers((prev) =>
          prev.map((org) => (org.id === id ? { ...org, isApproved: !currentStatus } : org))
        );
      } else {
        alert("Failed to update organizer approval status");
      }
    } catch (error) {
      console.error("Error updating organizer status:", error);
      alert("Something went wrong");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="glass" style={{ padding: "2rem", marginBottom: "2rem", textAlign: "center" }}>
        <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading organizer registry...</span>
      </div>
    );
  }

  return (
    <div className="glass" style={{ padding: "2rem", marginBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <UserCheck size={20} style={{ color: "var(--accent-primary)" }} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
          Campus Organizer <span className="gradient-text">Approval Panel</span>
        </h2>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)", fontWeight: 600 }}>
              <th style={{ padding: "0.75rem 0.5rem" }}>Name</th>
              <th style={{ padding: "0.75rem 0.5rem" }}>Email</th>
              <th style={{ padding: "0.75rem 0.5rem" }}>Registered On</th>
              <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizers.map((org) => (
              <tr key={org.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <td style={{ padding: "1rem 0.5rem", fontWeight: 600 }}>{org.name || "N/A"}</td>
                <td style={{ padding: "1rem 0.5rem", color: "var(--text-secondary)" }}>{org.email}</td>
                <td style={{ padding: "1rem 0.5rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  {new Date(org.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td style={{ padding: "1rem 0.5rem" }}>
                  <span
                    className={`badge ${org.isApproved ? "badge-success" : "badge-warning"}`}
                    style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem" }}
                  >
                    {org.isApproved ? "Approved" : "Pending Review"}
                  </span>
                </td>
                <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                  <button
                    onClick={() => handleToggleApproval(org.id, org.isApproved)}
                    disabled={processingId === org.id}
                    className={org.isApproved ? "btn-secondary" : "btn-primary"}
                    style={{
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.75rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      borderRadius: "6px",
                      opacity: processingId === org.id ? 0.6 : 1,
                      cursor: "pointer",
                    }}
                  >
                    {processingId === org.id ? (
                      "..."
                    ) : org.isApproved ? (
                      <>
                        <X size={12} /> Revoke
                      </>
                    ) : (
                      <>
                        <Check size={12} /> Approve
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}

            {organizers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "2rem 0.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No organizer accounts are currently registered on the portal.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
