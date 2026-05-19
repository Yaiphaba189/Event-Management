import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const { id: organizerId } = await params;
    const body = await request.json();
    const { isApproved } = body;

    if (isApproved === undefined) {
      return NextResponse.json({ error: "Missing required parameter: isApproved" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: organizerId },
      data: { isApproved: Boolean(isApproved) },
    });

    return NextResponse.json({
      message: `Organizer approval status updated to ${isApproved}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isApproved: updatedUser.isApproved,
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Update organizer approval error:", error);
    return NextResponse.json({ error: "Failed to update organizer approval status" }, { status: 500 });
  }
}
