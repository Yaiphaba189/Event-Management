import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

// GET /api/tickets - Get user's booked tickets
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionUser = await getSessionUser();
    let userId = searchParams.get("userId");

    if (!userId && sessionUser) {
      userId = sessionUser.id;
    }

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
      return NextResponse.json({ tickets: [] });
    }

    const tickets = await prisma.ticket.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            organizer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

// POST /api/tickets - Book a ticket for an event
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId } = body;
    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }
    const sessionUser = await getSessionUser();
    let userId = body.userId;

    if (!userId && sessionUser) {
      userId = sessionUser.id;
    }

    // Default to the first ATTENDEE in the database if no userId is specified
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: "ATTENDEE" },
      });
      if (!defaultUser) {
        return NextResponse.json({ error: "No attendee user found to book ticket" }, { status: 500 });
      }
      userId = defaultUser.id;
    }

    // Use a transaction to ensure capacity is not exceeded by concurrent requests
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the current ticket count and capacity for the event
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { 
          capacity: true, 
          category: true,
          _count: { select: { tickets: true } } 
        },
      });

      if (!event) {
        throw new Error("EVENT_NOT_FOUND");
      }

      // 2. Check capacity
      if (event._count.tickets >= event.capacity) {
        throw new Error("SOLD_OUT");
      }

      // 3. Check for existing booking
      const existingTicket = await tx.ticket.findFirst({
        where: { eventId, userId },
      });

      if (existingTicket) {
        throw new Error("ALREADY_BOOKED");
      }

      // 4. Generate unique ticket number
      const ticketNo = `UNI-${event.category.substring(0, 3)}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      // 5. Create the ticket
      return await tx.ticket.create({
        data: {
          userId,
          eventId,
          ticketNo,
          status: "CONFIRMED",
        },
        include: {
          event: true,
        },
      });
    });

    return NextResponse.json(
      { message: "Registration successful! Ticket booked.", ticket: result },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "EVENT_NOT_FOUND") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (error.message === "SOLD_OUT") {
      return NextResponse.json({ error: "Event is fully booked!" }, { status: 400 });
    }
    if (error.message === "ALREADY_BOOKED") {
      return NextResponse.json(
        { error: "You have already registered for this event!" },
        { status: 400 }
      );
    }
    console.error("Error booking ticket:", error);
    return NextResponse.json({ error: "Failed to book ticket" }, { status: 500 });
  }
}
