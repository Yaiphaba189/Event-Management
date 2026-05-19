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

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check capacity
    if (event._count.tickets >= event.capacity) {
      return NextResponse.json({ error: "Event is fully booked!" }, { status: 400 });
    }

    // Check if already registered
    const existingTicket = await prisma.ticket.findFirst({
      where: { eventId, userId },
    });

    if (existingTicket) {
      return NextResponse.json(
        { error: "You have already registered for this event!" },
        { status: 400 }
      );
    }

    // Generate unique ticket number
    const ticketNo = `UNI-${event.category.substring(0, 3)}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    const ticket = await prisma.ticket.create({
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

    return NextResponse.json(
      { message: "Registration successful! Ticket booked.", ticket },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error booking ticket:", error);
    return NextResponse.json({ error: "Failed to book ticket" }, { status: 500 });
  }
}
