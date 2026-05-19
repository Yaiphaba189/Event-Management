import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const organizers = await prisma.user.findMany({
      where: { role: "ORGANIZER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isApproved: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ organizers }, { status: 200 });
  } catch (error) {
    console.error("Fetch organizers error:", error);
    return NextResponse.json({ error: "Failed to fetch organizers" }, { status: 500 });
  }
}
