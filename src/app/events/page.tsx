import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Mic,
  Laptop,
  BookOpen,
  Video,
  Music,
  Sparkles,
  Trophy,
  Users,
  Calendar,
  Search,
  MapPin,
  Star,
  SearchX,
} from "lucide-react";

const categoryIcons: Record<
  string,
  React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>
> = {
  CONFERENCE: Mic,
  WORKSHOP: Laptop,
  SEMINAR: BookOpen,
  WEBINAR: Video,
  CONCERT: Music,
  FESTIVAL: Sparkles,
  SPORTS: Trophy,
  NETWORKING: Users,
  OTHER: Calendar,
};

interface PageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    price?: string;
  }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = params.category;
  const search = params.search;
  const priceType = params.price;

  // Build query
  const where: any = {};
  if (category && category !== "ALL") {
    where.category = category;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { venue: { contains: search, mode: "insensitive" } },
    ];
  }
  if (priceType === "free") {
    where.price = 0;
  } else if (priceType === "paid") {
    where.price = { gt: 0 };
  }

  // Fetch real university events
  const dbEvents = await prisma.event.findMany({
    where,
    include: {
      _count: {
        select: { tickets: true },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  return (
    <>
      {/* Header */}
      <section
        style={{
          position: "relative",
          padding: "4rem 1.5rem 3rem",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <div
          className="glow-orb glow-orb-primary"
          style={{
            width: "400px",
            height: "400px",
            top: "-150px",
            right: "10%",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="badge badge-primary" style={{ marginBottom: "1rem" }}>
            Campus Hub
          </div>
          <h1
            className="section-title"
            style={{ fontSize: "2.75rem", marginBottom: "0.75rem" }}
          >
            University <span className="gradient-text">Event Portal</span>
          </h1>
          <p className="section-subtitle" style={{ margin: "0 auto" }}>
            Discover and register for upcoming student fests, hackathons, sports meets, and seminars.
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem 2rem" }}>
        <form
          method="GET"
          action="/events"
          className="glass"
          style={{
            display: "flex",
            gap: "1rem",
            padding: "1rem",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            name="search"
            defaultValue={search || ""}
            placeholder="Search campus events..."
            className="input"
            style={{ flex: "1", minWidth: "200px" }}
          />
          <select
            name="category"
            defaultValue={category || ""}
            className="input"
            style={{
              flex: "0 0 180px",
              cursor: "pointer",
            }}
          >
            <option value="">All Categories</option>
            <option value="WORKSHOP">Workshops & Hackathons</option>
            <option value="FESTIVAL">Cultural Festivals</option>
            <option value="SEMINAR">Department Seminars</option>
            <option value="SPORTS">Campus Sports</option>
            <option value="NETWORKING">Alumni Networking</option>
          </select>
          <select
            name="price"
            defaultValue={priceType || ""}
            className="input"
            style={{
              flex: "0 0 150px",
              cursor: "pointer",
            }}
          >
            <option value="">All Prices</option>
            <option value="free">Free Events</option>
            <option value="paid">Paid Events</option>
          </select>
          <button
            type="submit"
            className="btn-primary"
            style={{
              flex: "0 0 auto",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Search size={16} /> Filter Events
          </button>
        </form>
      </section>

      {/* Events Grid */}
      <section className="section" style={{ paddingTop: "1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {dbEvents.map((event, i) => {
            const ticketsSold = event._count.tickets;
            const progress = event.capacity > 0 ? (ticketsSold / event.capacity) * 100 : 0;
            return (
              <Link
                href={`/events/${event.id}`}
                key={event.id}
                className="event-card animate-fade-in-up"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  animationDelay: `${i * 80}ms`,
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                {/* Image Placeholder */}
                <div
                  style={{
                    position: "relative",
                    height: "200px",
                    background: `linear-gradient(135deg, rgba(99, 102, 241, ${
                      0.15 + (i % 3) * 0.1
                    }), rgba(168, 85, 247, ${0.1 + (i % 3) * 0.08}))`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ opacity: 0.6, color: "var(--text-accent)" }}>
                    {(() => {
                      const IconComp = categoryIcons[event.category] || Calendar;
                      return <IconComp size={56} />;
                    })()}
                  </span>
                  {event.isFeatured && (
                    <span
                      className="badge badge-warning"
                      style={{
                        position: "absolute",
                        top: "1rem",
                        left: "1rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <Star size={10} style={{ fill: "currentColor" }} /> Featured
                    </span>
                  )}
                  {event.price === 0 && (
                    <span
                      className="badge badge-success"
                      style={{
                        position: "absolute",
                        top: "1rem",
                        right: "1rem",
                      }}
                    >
                      Free
                    </span>
                  )}
                </div>

                {/* Content */}
                <div
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <span className="badge badge-primary">
                      {event.category.charAt(0) +
                        event.category.slice(1).toLowerCase()}
                    </span>
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <Calendar size={12} />
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      marginBottom: "0.5rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {event.title}
                  </h3>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                      lineHeight: 1.6,
                      marginBottom: "1rem",
                      flex: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {event.description}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "1rem",
                      borderTop: "1px solid var(--border-color)",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                        maxWidth: "200px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <MapPin size={12} /> {event.location}
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        color: "var(--text-accent)",
                      }}
                    >
                      {event.price === 0 ? "Free" : `₹${event.price}`}
                    </span>
                  </div>

                  {/* Capacity Bar */}
                  <div style={{ marginTop: "0.75rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginBottom: "0.35rem",
                      }}
                    >
                      <span>
                        {ticketsSold}/{event.capacity} booked
                      </span>
                      <span>
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: "4px",
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
                </div>
              </Link>
            );
          })}
        </div>

        {dbEvents.length === 0 && (
          <div
            className="glass"
            style={{ padding: "4rem 2rem", textAlign: "center", gridColumn: "1 / -1" }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <SearchX size={48} style={{ color: "var(--text-muted)" }} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              No campus events found
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Try adjusting your filters or search keywords.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
