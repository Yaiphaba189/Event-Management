import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import CheckoutForm from "./CheckoutForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentPage({ params }: PageProps) {
  const { id: eventId } = await params;
  const sessionUser = await getSessionUser();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: { select: { name: true } }
    }
  });

  if (!event) {
    notFound();
  }

  // Ensure it's a paid event
  if (event.price <= 0) {
    return (
      <div style={{ maxWidth: "600px", margin: "6rem auto", textAlign: "center", padding: "3rem" }} className="glass">
        <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.5rem" }}>Free Event Registration</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>This event does not require payment processing. Please secure your spot directly from the event details screen.</p>
        <a href={`/events/${eventId}`} className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
          Back to Event Details
        </a>
      </div>
    );
  }

  // Check if Razorpay keys are configured
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const isRealMode = !!(keyId && keySecret && keyId !== "your-razorpay-key-id");

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <CheckoutForm
        event={{
          id: event.id,
          title: event.title,
          price: event.price,
          category: event.category,
          date: event.date.toISOString(),
          location: event.location,
          venue: event.venue,
          organizerName: event.organizer.name || "Campus Organizer",
        }}
        studentName={sessionUser?.name || "Campus Registrant"}
        studentEmail={sessionUser?.email || "attendee@university.edu"}
        sandboxMode={!isRealMode}
        keyId={isRealMode ? keyId! : "mock_key_id"}
      />
    </div>
  );
}
