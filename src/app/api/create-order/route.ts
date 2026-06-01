import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency, receipt } = body;

    if (!amount) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    const amountPaise = Number(amount);
    if (isNaN(amountPaise) || amountPaise < 100) {
      return NextResponse.json({ error: "Minimum amount must be 100 paise (₹1.00)" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId === "your-razorpay-key-id") {
      return NextResponse.json({ error: "Razorpay credentials not configured in environment" }, { status: 401 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: currency || "INR",
      receipt: receipt || `rcpt_${Math.random().toString(36).substring(2, 10)}`,
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Stand-alone create-order API error:", error);
    return NextResponse.json({ error: error.message || "Failed to create order on Razorpay" }, { status: 500 });
  }
}
