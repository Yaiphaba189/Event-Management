import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

// GET /api/events - List all events
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/events - Create a new event
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, date, endDate, location, venue, category, price, capacity, image, subEvents } = body;

    if (!title || !description || !date || !location || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== "ADMIN" && sessionUser.role !== "ORGANIZER")) {
      return NextResponse.json({ error: "Unauthorized: Only organizers and admins can create events" }, { status: 401 });
    }

    let organizerId = sessionUser.role === "ORGANIZER" ? sessionUser.id : (body.organizerId || sessionUser.id);
    if (!organizerId) {
      const defaultOrganizer = await prisma.user.findFirst({
        where: { role: "ORGANIZER" },
      });
      if (!defaultOrganizer) {
        return NextResponse.json({ error: "No organizer account found in the system" }, { status: 500 });
      }
      organizerId = defaultOrganizer.id;
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        location,
        venue: venue || null,
        category,
        price: Number(price) || 0,
        capacity: Number(capacity) || 100,
        image: image || null,
        subEvents: subEvents || null,
        organizerId,
      },
    });

    return NextResponse.json(
      { message: "Event created successfully", event },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
