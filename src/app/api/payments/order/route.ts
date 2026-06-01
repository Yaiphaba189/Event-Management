import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import Razorpay from "razorpay";

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

    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: "ATTENDEE" },
      });
      if (!defaultUser) {
        return NextResponse.json({ error: "No attendee user found to make payment" }, { status: 500 });
      }
      userId = defaultUser.id;
    }

    // Use transaction to verify capacity and create a PENDING ticket + PENDING payment
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Get the current ticket count and capacity for the event
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          price: true,
          capacity: true,
          category: true,
          _count: { select: { tickets: { where: { status: "CONFIRMED" } } } }
        },
      });

      if (!event) {
        throw new Error("EVENT_NOT_FOUND");
      }

      if (event.price <= 0) {
        throw new Error("EVENT_IS_FREE");
      }

      // 2. Check capacity
      if (event._count.tickets >= event.capacity) {
        throw new Error("SOLD_OUT");
      }

      // 3. Check for existing CONFIRMED booking
      const confirmedTicket = await tx.ticket.findFirst({
        where: { 
          eventId, 
          userId,
          status: "CONFIRMED"
        },
      });

      if (confirmedTicket) {
        throw new Error("ALREADY_BOOKED");
      }

      // Delete any stale PENDING tickets & payments to allow clean retries
      await tx.payment.deleteMany({
        where: { eventId, userId, status: "PENDING" }
      });
      await tx.ticket.deleteMany({
        where: { eventId, userId, status: "PENDING" }
      });

      // 4. Generate unique ticket number
      const ticketNo = `UNI-${event.category.substring(0, 3)}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      // 5. Create PENDING ticket
      const ticket = await tx.ticket.create({
        data: {
          userId,
          eventId,
          ticketNo,
          status: "PENDING",
        },
      });

      return { ticket, event };
    });

    const { ticket, event } = transactionResult;

    // Check if real Razorpay keys are configured
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isRealMode = !!(keyId && keySecret && keyId !== "your-razorpay-key-id");

    let razorpayOrderId = "";
    let amountPaise = Math.round(event.price * 100);

    if (isRealMode) {
      try {
        const razorpay = new Razorpay({
          key_id: keyId!,
          key_secret: keySecret!,
        });

        const order = await razorpay.orders.create({
          amount: amountPaise,
          currency: "INR",
          receipt: `rcpt_${ticket.id.substring(0, 10)}`,
        });

        razorpayOrderId = order.id;
      } catch (err) {
        console.error("Failed to create order on Razorpay SDK:", err);
        return NextResponse.json({ error: "Razorpay order creation failed" }, { status: 502 });
      }
    } else {
      // Keyless Simulated Sandbox Mode
      razorpayOrderId = `order_mock_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    }

    // Create a Payment record in DB linked to the Ticket
    await prisma.payment.create({
      data: {
        amount: event.price,
        currency: "INR",
        status: "PENDING",
        razorpayOrderId,
        userId,
        eventId,
        ticketId: ticket.id,
      },
    });

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      razorpayOrderId,
      amount: amountPaise,
      currency: "INR",
      sandboxMode: !isRealMode,
      keyId: isRealMode ? keyId : "mock_key_id",
      eventTitle: event.title,
    });

  } catch (error: any) {
    if (error.message === "EVENT_NOT_FOUND") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (error.message === "EVENT_IS_FREE") {
      return NextResponse.json({ error: "This event is free. Use standard booking." }, { status: 400 });
    }
    if (error.message === "SOLD_OUT") {
      return NextResponse.json({ error: "Event is fully booked!" }, { status: 400 });
    }
    if (error.message === "ALREADY_BOOKED") {
      return NextResponse.json({ error: "You have already registered/pending booking for this event!" }, { status: 400 });
    }
    console.error("Payment order creation error:", error);
    return NextResponse.json({ error: "Failed to initialize payment order" }, { status: 500 });
  }
}
