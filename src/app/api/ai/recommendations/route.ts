import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId");

    // Default to the first ATTENDEE in the database if no userId is specified
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: "ATTENDEE" },
      });
      if (defaultUser) {
        userId = defaultUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ recommendations: [] });
    }

    // 1. Try to fetch recommendations from the FastAPI Python microservice
    try {
      const response = await fetch(`${process.env.AI_SERVICE_URL || "http://localhost:8000"}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, limit: 5 }),
      });

      if (response.ok) {
        const data = await response.json();
        // Since the microservice returns event IDs (like 'evt_1'), let's map them to real database events
        const dbEvents = await prisma.event.findMany({
          include: { organizer: { select: { name: true } } },
        });

        // Match by title or category as fallback mapping
        const recommendations = data.recommendations.map((rec: any) => {
          const matchingEvent = dbEvents.find(
            (e) =>
              e.title.toLowerCase().includes(rec.title.toLowerCase()) ||
              e.category.toLowerCase() === rec.category.toLowerCase()
          );
          return {
            eventId: matchingEvent?.id || dbEvents[0]?.id || "unknown",
            title: matchingEvent?.title || rec.title,
            score: rec.score,
            reason: rec.reason,
            category: matchingEvent?.category || rec.category,
          };
        });

        return NextResponse.json({
          userId,
          recommendations,
          source: "FastAPI ML Microservice (Collaborative Filtering)",
          generatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.log("FastAPI service unreachable, falling back to database-driven AI recommendations...");
    }

    // 2. Hybrid Database-driven Recommendation Fallback
    // Get user's booked tickets to find their favorite categories
    const userTickets = await prisma.ticket.findMany({
      where: { userId },
      include: { event: true },
    });

    const bookedCategories = userTickets.map((t) => t.event.category);
    const categoryCounts: Record<string, number> = {};
    bookedCategories.forEach((cat) => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Find all events that the user has NOT booked yet
    const bookedEventIds = userTickets.map((t) => t.eventId);
    const allEvents = await prisma.event.findMany({
      where: {
        id: { notIn: bookedEventIds },
      },
      include: { organizer: { select: { name: true } } },
    });

    // Score events: higher score if matching user's favorite categories, plus some recency/popularity score
    const scoredRecommendations = allEvents.map((event) => {
      const categoryMatchCount = categoryCounts[event.category] || 0;
      // Base score
      let score = 0.5;
      // Add boost for category match
      score += categoryMatchCount * 0.25;
      // Add boost if event is featured
      if (event.isFeatured) score += 0.15;
      // Cap at 0.98
      score = Math.min(score, 0.98);

      let reason = "Popular among campus students";
      if (categoryMatchCount > 0) {
        reason = `Based on your interest in university ${event.category.toLowerCase()} events`;
      } else if (event.isFeatured) {
        reason = "Featured high-demand campus event";
      }

      return {
        eventId: event.id,
        title: event.title,
        score: Math.round(score * 100) / 100,
        reason,
        category: event.category,
      };
    });

    // Sort by score
    scoredRecommendations.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      userId,
      recommendations: scoredRecommendations.slice(0, 5),
      source: "Hybrid Database Rec-Engine (Fallback)",
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Recommendations error:", error);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
