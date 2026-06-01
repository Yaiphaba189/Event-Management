import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "ADMIN" && sessionUser.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden: Access restricted to admins and organizers" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { attended } = body;

    if (typeof attended !== "boolean") {
      return NextResponse.json({ error: "Invalid attended value. Must be a boolean." }, { status: 400 });
    }

    // Load ticket to verify event owner permissions
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Constraint: Organizers can only verify tickets for their own events
    if (sessionUser.role === "ORGANIZER" && ticket.event.organizerId !== sessionUser.id) {
      return NextResponse.json({ error: "Forbidden: You are not authorized to check-in students for this event" }, { status: 403 });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { attended },
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
          },
        },
      },
    });

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    console.error("Attendance update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
