import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "ADMIN" && sessionUser.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden: Access restricted to admins and organizers" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";

    if (!query) {
      return NextResponse.json({ tickets: [] });
    }

    // Build the query constraints
    const whereClause: any = {
      OR: [
        { ticketNo: { contains: query, mode: "insensitive" } },
        { user: { name: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
      ],
    };

    // If organizer, only allow searching tickets for events they organize
    if (sessionUser.role === "ORGANIZER") {
      whereClause.event = { organizerId: sessionUser.id };
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            title: true,
            category: true,
            date: true,
            price: true,
          },
        },
        payment: {
          select: {
            status: true,
            razorpayPaymentId: true,
            amount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20, // cap results for efficiency
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Ticket search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
