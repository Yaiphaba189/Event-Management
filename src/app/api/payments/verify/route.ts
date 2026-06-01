import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, ticketId } = body;

    if (!razorpayPaymentId || !razorpayOrderId || !ticketId) {
      return NextResponse.json({ error: "Missing required verification details" }, { status: 400 });
    }

    // 1. Fetch the pending payment and ticket details
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId, ticketId },
      include: { ticket: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    if (payment.status === "COMPLETED") {
      return NextResponse.json({
        message: "Payment already verified",
        ticket: payment.ticket,
      });
    }

    // Check if in mock sandbox mode
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isRealMode = !!(keyId && keySecret && keyId !== "your-razorpay-key-id");

    let isSignatureValid = false;

    if (isRealMode) {
      // Real Razorpay signature verification
      try {
        const text = `${razorpayOrderId}|${razorpayPaymentId}`;
        const generated_signature = crypto
          .createHmac("sha256", keySecret!)
          .update(text)
          .digest("hex");

        isSignatureValid = generated_signature === razorpaySignature;
      } catch (err) {
        console.error("Signature HMAC verification error:", err);
      }
    } else {
      // Sandbox Mode validation: Accept signature if it starts with mock_
      isSignatureValid = 
        razorpayPaymentId.startsWith("pay_mock_") && 
        razorpayOrderId.startsWith("order_mock_") && 
        (razorpaySignature === `mock_sig_${razorpayPaymentId.substring(9)}` || razorpaySignature === "mock_signature");
    }

    if (!isSignatureValid) {
      // Mark payment as FAILED and delete/cancel the ticket
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        }),
        prisma.ticket.update({
          where: { id: ticketId },
          data: { status: "CANCELLED" },
        })
      ]);

      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 2. Signature is valid, update both Payment and Ticket in a transaction
    const updateResult = await prisma.$transaction(async (tx) => {
      // Double check capacity again in case of concurrent bookings
      const event = await tx.event.findUnique({
        where: { id: payment.eventId },
        select: {
          capacity: true,
          _count: { select: { tickets: { where: { status: "CONFIRMED" } } } }
        }
      });

      if (!event) {
        throw new Error("EVENT_NOT_FOUND");
      }

      if (event._count.tickets >= event.capacity) {
        throw new Error("SOLD_OUT");
      }

      // Update payment
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          razorpayPaymentId,
          razorpaySignature,
        },
      });

      // Confirm ticket
      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: "CONFIRMED",
        },
        include: {
          event: true,
        }
      });

      return { updatedPayment, updatedTicket };
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully!",
      ticket: updateResult.updatedTicket,
    }, { status: 200 });

  } catch (error: any) {
    if (error.message === "EVENT_NOT_FOUND") {
      return NextResponse.json({ error: "Event not found during verification" }, { status: 404 });
    }
    if (error.message === "SOLD_OUT") {
      // If sold out, refund must be issued, mark payment failed, ticket cancelled
      return NextResponse.json({ error: "Event fully booked! Payment voided." }, { status: 400 });
    }
    console.error("Payment verification API error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
