import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== "ADMIN" && sessionUser.role !== "ORGANIZER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // If organizer, ensure they own the event
    if (sessionUser.role === "ORGANIZER" && event.organizerId !== sessionUser.id) {
      return NextResponse.json({ error: "You can only delete your own events" }, { status: 403 });
    }

    // Delete related records first to avoid foreign key violations
    await prisma.feedback.deleteMany({ where: { eventId } });
    await prisma.ticket.deleteMany({ where: { eventId } });
    
    // Delete the event
    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ message: "Event deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Delete event error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== "ADMIN" && sessionUser.role !== "ORGANIZER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const { title, description, date, endDate, location, venue, category, price, capacity, image, subEvents } = body;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // If organizer, ensure they own the event
    if (sessionUser.role === "ORGANIZER" && event.organizerId !== sessionUser.id) {
      return NextResponse.json({ error: "You can only edit your own events" }, { status: 403 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: title !== undefined ? title : event.title,
        description: description !== undefined ? description : event.description,
        date: date !== undefined ? new Date(date) : event.date,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : event.endDate,
        location: location !== undefined ? location : event.location,
        venue: venue !== undefined ? venue : event.venue,
        category: category !== undefined ? category : event.category,
        price: price !== undefined ? Number(price) : event.price,
        capacity: capacity !== undefined ? Number(capacity) : event.capacity,
        image: image !== undefined ? image : event.image,
        subEvents: subEvents !== undefined ? subEvents : event.subEvents,
      },
    });

    return NextResponse.json({ message: "Event updated successfully", event: updatedEvent }, { status: 200 });
  } catch (error: any) {
    console.error("Update event error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}
