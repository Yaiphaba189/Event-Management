import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import Razorpay from "razorpay";

interface RouteParams {
  params: Promise<{ id?: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ticketId } = await params;
    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    // 1. Fetch the ticket details along with any related payment record
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        payment: true,
        event: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Ensure the ticket belongs to the user, or the user is an organizer/admin
    if (
      ticket.userId !== sessionUser.id &&
      sessionUser.role !== "ADMIN" &&
      sessionUser.role !== "ORGANIZER"
    ) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    if (ticket.status === "CANCELLED") {
      return NextResponse.json({ error: "Ticket is already cancelled" }, { status: 400 });
    }

    if (ticket.attended) {
      return NextResponse.json({ error: "Cannot cancel a ticket once you have checked in to the event" }, { status: 400 });
    }

    // 2. Check if a refund needs to be processed
    const payment = ticket.payment;
    let isRefunded = false;
    let refundErrorMessage = "";

    if (payment && payment.status === "COMPLETED") {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      const isRealMode = !!(keyId && keySecret && keyId !== "your-razorpay-key-id");

      if (isRealMode && payment.razorpayPaymentId) {
        try {
          const razorpay = new Razorpay({
            key_id: keyId!,
            key_secret: keySecret!,
          });

          const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: Math.round(payment.amount * 100), // full refund in paise
            notes: {
              ticketId: ticket.id,
              reason: "Attendee cancelled booking",
            },
          });

          if (refund && refund.id) {
            isRefunded = true;
          } else {
            refundErrorMessage = "Razorpay SDK refund call returned no refund ID.";
          }
        } catch (err: any) {
          console.error("Error calling Razorpay SDK refund:", err);
          refundErrorMessage = err.message || "Failed to communicate with Razorpay via SDK.";
        }
      } else {
        // Sandbox Simulation Mode - refund succeeded instantly
        isRefunded = true;
      }
    } else {
      // Free tickets or pending tickets don't need financial refunds
      isRefunded = true;
    }

    if (payment && payment.status === "COMPLETED" && !isRefunded) {
      return NextResponse.json(
        { error: refundErrorMessage || "Refund processing failed" },
        { status: 500 }
      );
    }

    // 3. Update the DB in a transaction
    await prisma.$transaction(async (tx) => {
      // Cancel the ticket
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: "CANCELLED" },
      });

      // Update payment to REFUNDED if applicable
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: payment.status === "COMPLETED" ? "REFUNDED" : "FAILED" },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: payment && payment.status === "COMPLETED"
        ? "Registration cancelled. Your refund has been initiated!"
        : "Registration cancelled successfully.",
    });

  } catch (error: any) {
    console.error("Ticket cancellation API error:", error);
    return NextResponse.json({ error: "Failed to cancel ticket registration" }, { status: 500 });
  }
}
