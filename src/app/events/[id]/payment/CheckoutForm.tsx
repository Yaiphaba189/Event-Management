"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  MapPin, 
  Building, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Ticket,
  Smartphone,
  Building2,
  Coins
} from "lucide-react";

interface EventProps {
  id: string;
  title: string;
  price: number;
  category: string;
  date: string;
  location: string;
  venue: string | null;
  organizerName: string;
}

interface CheckoutFormProps {
  event: EventProps;
  studentName: string;
  studentEmail: string;
  sandboxMode: boolean;
  keyId: string;
}

// Hydration-safe static date formatters to avoid server-client locale mismatches
const formatDateTimeStatic = (dateInput: Date | string) => {
  const d = new Date(dateInput);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const weekday = weekdays[d.getUTCDay()];
  const month = months[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  
  let hours = d.getUTCHours();
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = hours.toString().padStart(2, "0");
  
  return `${weekday}, ${month} ${day}, ${year} at ${hoursStr}:${minutes} ${ampm}`;
};

const formatDateStatic = (dateInput: Date | string) => {
  const d = new Date(dateInput);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const weekday = weekdays[d.getUTCDay()];
  const month = months[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  
  return `${weekday}, ${month} ${day}, ${year}`;
};

export default function CheckoutForm({
  event,
  studentName,
  studentEmail,
  sandboxMode,
  keyId
}: CheckoutFormProps) {
  const router = useRouter();
  
  // Checkout & Payment States
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{
    success: boolean;
    message: string;
    ticketNo?: string;
  } | null>(null);

  // Sandbox Form States
  const [sandboxStep, setSandboxStep] = useState<"method" | "card" | "card-otp" | "upi-pin" | "nb-login">("method");
  const [sandboxMethod, setSandboxMethod] = useState<"card" | "upi" | "netbanking" | "cod">("card");
  
  // Card Fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  // UPI Fields
  const [upiId, setUpiId] = useState("");
  const [selectedUpiApp, setSelectedUpiApp] = useState<"gpay" | "phonepe" | "paytm">("gpay");

  // Net Banking Fields
  const [selectedBank, setSelectedBank] = useState("SBI");
  const [bankUsername, setBankUsername] = useState("");
  const [bankPassword, setBankPassword] = useState("");

  // Verification Input
  const [otpVal, setOtpVal] = useState("");
  const [isPayingSim, setIsPayingSim] = useState(false);

  // Backend Order IDs
  const [orderId, setOrderId] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  // Load Razorpay Script in Background
  useEffect(() => {
    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Format Card Number (space every 4 digits)
  const formatCardNumStr = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  // 1. Initialize Order on Backend
  const handleInitiatePayment = async () => {
    setIsLoading(true);
    setPaymentStatus(null);
    try {
      const res = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPaymentStatus({
          success: false,
          message: data.error || "Failed to initiate transaction order."
        });
        setIsLoading(false);
        return;
      }

      setOrderId(data.razorpayOrderId);
      setTicketId(data.ticketId);

      if (sandboxMode) {
        // Open Sandbox Selector Tab
        setSandboxStep("method");
        setIsLoading(false);
      } else {
        // Trigger official Razorpay widget
        const options = {
          key: keyId,
          amount: data.amount,
          currency: "INR",
          name: "Evently Checkout",
          description: `Entry Pass for ${event.title}`,
          order_id: data.razorpayOrderId,
          handler: async function (response: any) {
            setIsVerifying(true);
            try {
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                  ticketId: data.ticketId,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok) {
                setPaymentStatus({
                  success: true,
                  message: "Payment successfully verified! Your entry pass is ready.",
                  ticketNo: verifyData.ticket.ticketNo,
                });
              } else {
                setPaymentStatus({
                  success: false,
                  message: verifyData.error || "Payment verification failed."
                });
              }
            } catch {
              setPaymentStatus({
                success: false,
                message: "Verification network error occurred. Please contact support."
              });
            } finally {
              setIsVerifying(false);
              setIsLoading(false);
            }
          },
          prefill: {
            name: studentName,
            email: studentEmail,
          },
          theme: {
            color: "#6366f1",
          },
          modal: {
            ondismiss: function () {
              setIsLoading(false);
            }
          }
        };

        if (typeof (window as any).Razorpay === "undefined") {
          setPaymentStatus({
            success: false,
            message: "Razorpay Standard Checkout SDK is still loading in your browser. Please wait a moment and try again."
          });
          setIsLoading(false);
          return;
        }
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch {
      setPaymentStatus({
        success: false,
        message: "Failed to communicate with billing server."
      });
      setIsLoading(false);
    }
  };

  // Submit verify request helper
  const triggerVerifyBackend = async (methodLabel: string) => {
    setIsPayingSim(true);
    setIsVerifying(true);

    try {
      const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const mockSignature = `mock_sig_${mockPaymentId.substring(9)}`;

      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpayPaymentId: mockPaymentId,
          razorpayOrderId: orderId,
          razorpaySignature: mockSignature,
          ticketId: ticketId,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyRes.ok) {
        setPaymentStatus({
          success: true,
          message: `Simulated ${methodLabel} payment verified! Ticket booked.`,
          ticketNo: verifyData.ticket.ticketNo,
        });
      } else {
        setPaymentStatus({
          success: false,
          message: verifyData.error || "Sandbox verification rejected transaction."
        });
      }
    } catch {
      setPaymentStatus({
        success: false,
        message: "Sandbox payment processing failed."
      });
    } finally {
      setIsPayingSim(false);
      setIsVerifying(false);
    }
  };

  // Sandbox card submit (Proceed to Card OTP)
  const handleSandboxCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
      alert("Please enter all card details.");
      return;
    }
    setIsPayingSim(true);
    setTimeout(() => {
      setIsPayingSim(false);
      setSandboxStep("card-otp");
    }, 1000);
  };

  // Sandbox OTP submit (Card)
  const handleCardOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVal) {
      alert("Please enter simulation OTP.");
      return;
    }
    await triggerVerifyBackend("Debit Card");
  };

  // Sandbox UPI submit (Proceed to UPI Pin entry)
  const handleSandboxUpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId) {
      alert("Please enter your UPI ID.");
      return;
    }
    setIsPayingSim(true);
    setTimeout(() => {
      setIsPayingSim(false);
      setOtpVal(""); // Reuse OTP state for 4-digit UPI PIN
      setSandboxStep("upi-pin");
    }, 1000);
  };

  // Sandbox UPI PIN verify
  const handleUpiPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVal || otpVal.length < 4) {
      alert("Please enter 4-Digit UPI PIN.");
      return;
    }
    const appLabel = selectedUpiApp === "gpay" ? "Google Pay" : selectedUpiApp === "phonepe" ? "PhonePe" : "Paytm";
    await triggerVerifyBackend(appLabel);
  };

  // Sandbox Net Banking select
  const handleSandboxNbSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPayingSim(true);
    setTimeout(() => {
      setIsPayingSim(false);
      setSandboxStep("nb-login");
    }, 1000);
  };

  // Sandbox Net Banking Login
  const handleNbLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankUsername || !bankPassword) {
      alert("Please enter bank credentials.");
      return;
    }
    await triggerVerifyBackend(`Net Banking (${selectedBank})`);
  };

  // Sandbox COD Cash complete
  const handleSandboxCodSubmit = async () => {
    await triggerVerifyBackend("Cash on Delivery (Booth)");
  };

  const ticketPrice = event.price;
  const sgst = ticketPrice * 0.09;
  const cgst = ticketPrice * 0.09;
  const totalAmount = ticketPrice + sgst + cgst;

  // Render Success Pass Receipt Card
  if (paymentStatus?.success) {
    return (
      <div style={{ maxWidth: "580px", margin: "4rem auto", padding: "1rem" }} className="animate-fade-in-up">
        <div 
          className="glass"
          style={{
            borderRadius: "24px",
            padding: "3rem 2rem",
            textAlign: "center",
            border: "1px solid rgba(52, 211, 153, 0.2)",
            boxShadow: "0 20px 45px rgba(52, 211, 153, 0.08)"
          }}
        >
          <div style={{ display: "inline-flex", justifyContent: "center", marginBottom: "1.5rem", color: "var(--success)" }}>
            <CheckCircle2 size={56} className="animate-pulse-glow" />
          </div>
          
          <h2 style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "0.5rem" }}>
            Booking Confirmed!
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "380px", margin: "0 auto 2rem" }}>
            Thank you! Your transaction completed successfully. Your campus entry pass has been generated.
          </p>

          {/* Glowing Digital Pass Container */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              padding: "1.5rem",
              marginBottom: "2.5rem",
              position: "relative",
              textAlign: "left"
            }}
          >
            {/* Ticket header */}
            <div style={{ borderBottom: "1px dashed var(--border-color)", paddingBottom: "1rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Event Entry Pass</span>
              <h4 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0.25rem 0 0" }}>{event.title}</h4>
            </div>

            {/* Ticket details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Date:</span> <strong>{formatDateStatic(event.date)}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Location:</span> <strong>{event.venue ? `${event.venue}, ` : ""}{event.location}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Attendee:</span> <strong>{studentName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>PASS NUMBER:</span>
                  <code style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--text-accent)", fontWeight: 700, fontSize: "0.9rem" }}>{paymentStatus.ticketNo}</code>
                </div>
                <span style={{ padding: "0.2rem 0.6rem", background: "rgba(52, 211, 153, 0.12)", color: "var(--success)", fontSize: "0.7rem", fontWeight: 800, borderRadius: "4px" }}>
                  VERIFIED
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={() => router.push("/tickets")}
              className="btn-primary"
              style={{ flex: 1, padding: "0.9rem", fontSize: "0.95rem", fontWeight: 700 }}
            >
              Go to My Tickets
            </button>
            <button
              onClick={() => router.push(`/events/${event.id}`)}
              className="btn-secondary"
              style={{ flex: 1, padding: "0.9rem", fontSize: "0.95rem" }}
            >
              Back to Event
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Back navigation */}
      <div>
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            cursor: "pointer",
            padding: "0.5rem 0",
            transition: "color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
        >
          <ArrowLeft size={16} /> Back to Event Details
        </button>
      </div>

      {/* Main Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "2rem",
          alignItems: "start"
        }}
      >
        {/* LEFT COLUMN: Billing Invoice Receipt Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="glass" style={{ padding: "2rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1.25rem" }}>
              Billing Summary
            </h3>
            
            {/* Event Small Card */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                padding: "1rem",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                marginBottom: "1.5rem"
              }}
            >
              <div 
                style={{ 
                  flex: "0 0 54px", 
                  height: "54px", 
                  borderRadius: "8px", 
                  background: "var(--accent-gradient)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "#fff"
                }}
              >
                <Ticket size={24} />
              </div>
              <div>
                <span className="badge badge-primary" style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem" }}>{event.category}</span>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0.2rem 0 0" }}>{event.title}</h4>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>By {event.organizerName}</p>
              </div>
            </div>

            {/* Event Time Location details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={14} style={{ color: "var(--accent-primary)" }} />
                <span>{formatDateTimeStatic(event.date)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MapPin size={14} style={{ color: "var(--accent-primary)" }} />
                <span>{event.venue ? `${event.venue}, ` : ""}{event.location}</span>
              </div>
            </div>

            {/* Billing items invoice */}
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem" }}>Itemized Invoice</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>1x Admission Entry Pass</span>
                  <strong>₹{ticketPrice}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>State GST (SGST) 9%</span>
                  <span>₹{sgst.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Central GST (CGST) 9%</span>
                  <span>₹{cgst.toFixed(2)}</span>
                </div>
                <div 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    borderTop: "1px solid var(--border-color)", 
                    paddingTop: "0.75rem", 
                    marginTop: "0.5rem", 
                    fontWeight: 800, 
                    fontSize: "1.1rem", 
                    color: "#fff"
                  }}
                >
                  <span>Grand Total</span>
                  <span className="gradient-text">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secure Trust Stamp */}
          <div 
            className="glass" 
            style={{ 
              padding: "1.25rem", 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem", 
              borderLeft: "4px solid var(--success)",
              background: "rgba(52, 211, 153, 0.03)"
            }}
          >
            <ShieldCheck size={28} style={{ color: "var(--success)", flexShrink: 0 }} />
            <div>
              <h5 style={{ fontSize: "0.85rem", fontWeight: 700, margin: 0, color: "var(--success)" }}>SSL SECURED & COMPLIANT</h5>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                All payment operations are handled securely in compliance with PCIDSS standards.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Gateway Form / Opener */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {!orderId ? (
            /* Phase 1: Initialize Payment Trigger */
            <div className="glass" style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
              <div 
                style={{ 
                  width: "56px", 
                  height: "56px", 
                  borderRadius: "50%", 
                  background: "rgba(99, 102, 241, 0.08)", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "var(--accent-primary)",
                  marginBottom: "1.25rem"
                }}
              >
                <CreditCard size={28} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                Gateway Connection
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "340px", margin: "0 auto 1.5rem", lineHeight: 1.5 }}>
                Ready to initialize checkout with {sandboxMode ? "Razorpay Sandbox Simulation Mode" : "Razorpay Secure Gateway"}. Click below to configure.
              </p>

              {paymentStatus && !paymentStatus.success && (
                <div style={{ padding: "0.75rem", background: "rgba(248, 113, 113, 0.08)", color: "var(--error)", borderRadius: "8px", fontSize: "0.8rem", marginBottom: "1rem" }}>
                  <AlertTriangle size={12} style={{ marginRight: "0.25rem", display: "inline" }} /> {paymentStatus.message}
                </div>
              )}

              <button
                onClick={handleInitiatePayment}
                disabled={isLoading}
                className="btn-primary animate-pulse-glow"
                style={{
                  width: "100%",
                  padding: "1rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  cursor: "pointer"
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Contacting Gateway...
                  </>
                ) : (
                  <>
                    <Lock size={16} /> Proceed to Secure Checkout
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Phase 2: Active Order - Render Checkout */
            <div className="glass animate-fade-in-up" style={{ padding: "2rem" }}>
              {sandboxMode ? (
                /* 💳 SANDBOX SIMULATOR EMBEDDED PAGE */
                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      color: "var(--warning)",
                      background: "rgba(245, 158, 11, 0.1)",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "var(--radius-full)",
                      marginBottom: "1rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <ShieldCheck size={12} /> Sandbox Simulation Mode
                  </div>

                  {/* Payment Method Selector Tabs */}
                  {sandboxStep === "method" && (
                    <div style={{ marginTop: "1rem" }}>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "1rem" }}>Select Payment Option</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <button
                          type="button"
                          onClick={() => { setSandboxMethod("card"); setSandboxStep("card"); }}
                          className="glass-hover"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            padding: "1rem",
                            borderRadius: "12px",
                            border: "1px solid var(--border-color)",
                            background: "rgba(255,255,255,0.02)",
                            color: "#fff",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          <CreditCard size={20} style={{ color: "var(--accent-primary)" }} />
                          <div>
                            <strong style={{ fontSize: "0.9rem", display: "block" }}>Debit/Credit Card</strong>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Visa, Mastercard, RuPay, Maestro</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setSandboxMethod("upi"); setSandboxStep("method"); }}
                          className="glass-hover"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            padding: "1rem",
                            borderRadius: "12px",
                            border: "1px solid var(--border-color)",
                            background: "rgba(255,255,255,0.02)",
                            color: "#fff",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          <Smartphone size={20} style={{ color: "var(--accent-primary)" }} />
                          <div>
                            <strong style={{ fontSize: "0.9rem", display: "block" }}>GPay / PhonePe / UPI</strong>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Instant checkout using UPI App or VPA</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setSandboxMethod("netbanking"); setSandboxStep("method"); }}
                          className="glass-hover"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            padding: "1rem",
                            borderRadius: "12px",
                            border: "1px solid var(--border-color)",
                            background: "rgba(255,255,255,0.02)",
                            color: "#fff",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          <Building2 size={20} style={{ color: "var(--accent-primary)" }} />
                          <div>
                            <strong style={{ fontSize: "0.9rem", display: "block" }}>Net Banking</strong>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Direct checkout via Indian retail banking portals</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setSandboxMethod("cod"); setSandboxStep("method"); }}
                          className="glass-hover"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            padding: "1rem",
                            borderRadius: "12px",
                            border: "1px solid var(--border-color)",
                            background: "rgba(255,255,255,0.02)",
                            color: "#fff",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          <Coins size={20} style={{ color: "var(--accent-primary)" }} />
                          <div>
                            <strong style={{ fontSize: "0.9rem", display: "block" }}>Cash on Delivery (COD) / Booth Pay</strong>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Pay cash at registration desks on campus</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 1. UPI/GPay Checkout Screen */}
                  {sandboxStep === "method" && sandboxMethod === "upi" && (
                    <form onSubmit={handleSandboxUpiSubmit} style={{ marginTop: "1rem" }} className="animate-fade-in-up">
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.75rem" }}>Pay via UPI / GPay</h4>
                      
                      {/* Popular UPI Apps grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedUpiApp("gpay")}
                          style={{
                            padding: "0.75rem",
                            borderRadius: "8px",
                            border: `1px solid ${selectedUpiApp === "gpay" ? "var(--accent-primary)" : "var(--border-color)"}`,
                            background: selectedUpiApp === "gpay" ? "rgba(99,102,241,0.08)" : "transparent",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                          }}
                        >
                          GPay
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedUpiApp("phonepe")}
                          style={{
                            padding: "0.75rem",
                            borderRadius: "8px",
                            border: `1px solid ${selectedUpiApp === "phonepe" ? "var(--accent-primary)" : "var(--border-color)"}`,
                            background: selectedUpiApp === "phonepe" ? "rgba(99,102,241,0.08)" : "transparent",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                          }}
                        >
                          PhonePe
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedUpiApp("paytm")}
                          style={{
                            padding: "0.75rem",
                            borderRadius: "8px",
                            border: `1px solid ${selectedUpiApp === "paytm" ? "var(--accent-primary)" : "var(--border-color)"}`,
                            background: selectedUpiApp === "paytm" ? "rgba(99,102,241,0.08)" : "transparent",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                          }}
                        >
                          Paytm
                        </button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.35rem", fontWeight: 600 }}>
                            Enter UPI ID / VPA
                          </label>
                          <input
                            type="text"
                            placeholder="student@okaxis"
                            className="input"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isPayingSim}
                          className="btn-primary"
                          style={{
                            width: "100%",
                            padding: "1rem",
                            fontSize: "1rem",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem"
                          }}
                        >
                          {isPayingSim ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <>
                              <Lock size={16} /> Pay ₹{totalAmount.toFixed(2)} Securely
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSandboxStep("method")}
                          style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", padding: "0.5rem" }}
                        >
                          ← Change Payment Method
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 2. UPI Pin Simulation Screen */}
                  {sandboxStep === "upi-pin" && (
                    <form onSubmit={handleUpiPinSubmit} style={{ marginTop: "1rem" }} className="animate-fade-in-up">
                      <div style={{ textAlign: "center", padding: "1rem 0" }}>
                        <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(99,102,241,0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--accent-primary)", marginBottom: "1rem" }}>
                          <Smartphone size={26} />
                        </div>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.5rem" }}>Enter UPI PIN</h4>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", maxWidth: "290px", margin: "0 auto 1.5rem", lineHeight: 1.5 }}>
                          Enter your secure 4-Digit UPI PIN on your simulated {selectedUpiApp.toUpperCase()} app.
                        </p>

                        <div style={{ maxWidth: "160px", margin: "0 auto 1.5rem" }}>
                          <input
                            type="password"
                            placeholder="••••"
                            maxLength={4}
                            className="input"
                            style={{ fontSize: "1.5rem", fontWeight: 800, textAlign: "center", letterSpacing: "0.3em", borderColor: "rgba(99, 102, 241, 0.3)" }}
                            value={otpVal}
                            onChange={(e) => setOtpVal(e.target.value.replace(/[^0-9]/g, ""))}
                            required
                          />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <button
                            type="submit"
                            disabled={isPayingSim}
                            className="btn-primary"
                            style={{
                              width: "100%",
                              padding: "1rem",
                              fontSize: "1rem",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.5rem"
                            }}
                          >
                            {isVerifying ? (
                              <>
                                <Loader2 size={18} className="animate-spin" /> Processing UPI...
                              </>
                            ) : (
                              "Verify PIN & Complete Payment"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSandboxStep("method")}
                            style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", padding: "0.5rem" }}
                          >
                            ← Back to Selector
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* 3. Net Banking Selector Screen */}
                  {sandboxStep === "method" && sandboxMethod === "netbanking" && (
                    <form onSubmit={handleSandboxNbSubmit} style={{ marginTop: "1rem" }} className="animate-fade-in-up">
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.75rem" }}>Select Net Banking Portal</h4>
                      
                      {/* Bank Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
                        {[
                          { key: "SBI", name: "State Bank of India" },
                          { key: "HDFC", name: "HDFC Bank" },
                          { key: "ICICI", name: "ICICI Bank" },
                          { key: "AXIS", name: "Axis Bank" },
                        ].map((bank) => (
                          <button
                            key={bank.key}
                            type="button"
                            onClick={() => setSelectedBank(bank.key)}
                            style={{
                              padding: "1rem",
                              borderRadius: "10px",
                              border: `1px solid ${selectedBank === bank.key ? "var(--accent-primary)" : "var(--border-color)"}`,
                              background: selectedBank === bank.key ? "rgba(99,102,241,0.08)" : "transparent",
                              color: "#fff",
                              textAlign: "left",
                              cursor: "pointer",
                            }}
                          >
                            <strong style={{ fontSize: "0.85rem", display: "block" }}>{bank.key}</strong>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{bank.name}</span>
                          </button>
                        ))}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <button
                          type="submit"
                          disabled={isPayingSim}
                          className="btn-primary"
                          style={{
                            width: "100%",
                            padding: "1rem",
                            fontSize: "1rem",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem"
                          }}
                        >
                          {isPayingSim ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <>
                              <Lock size={16} /> Proceed to Secure Bank Portal
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSandboxStep("method")}
                          style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", padding: "0.5rem" }}
                        >
                          ← Change Payment Method
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 4. Net Banking Login Simulation */}
                  {sandboxStep === "nb-login" && (
                    <form onSubmit={handleNbLoginSubmit} style={{ marginTop: "1rem" }} className="animate-fade-in-up">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
                        <Building2 size={20} style={{ color: "var(--accent-primary)" }} />
                        <h4 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0 }}>Secure {selectedBank} NetBanking Login</h4>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.35rem", fontWeight: 600 }}>
                            NetBanking User ID
                          </label>
                          <input
                            type="text"
                            placeholder="bank_user_12345"
                            className="input"
                            value={bankUsername}
                            onChange={(e) => setBankUsername(e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.35rem", fontWeight: 600 }}>
                            Login Password / PIN
                          </label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            className="input"
                            value={bankPassword}
                            onChange={(e) => setBankPassword(e.target.value)}
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isPayingSim}
                          className="btn-primary"
                          style={{
                            width: "100%",
                            padding: "1rem",
                            fontSize: "1rem",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            marginTop: "0.5rem"
                          }}
                        >
                          {isVerifying ? (
                            <>
                              <Loader2 size={18} className="animate-spin" /> Connecting Bank...
                            </>
                          ) : (
                            "Log In & Confirm payment"
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSandboxStep("method")}
                          style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", padding: "0.5rem" }}
                        >
                          ← Cancel & Change Method
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 5. COD Cash on Delivery Booth Pay Screen */}
                  {sandboxStep === "method" && sandboxMethod === "cod" && (
                    <div style={{ marginTop: "1rem", textAlign: "center" }} className="animate-fade-in-up">
                      <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(52, 211, 153, 0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--success)", marginBottom: "1.25rem" }}>
                        <Coins size={26} />
                      </div>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.5rem" }}>Cash on Delivery / Booth Pay</h4>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "320px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                        Select this option to reserve your event entry ticket instantly. You can pay cash physically at the Manipur University Event Coordinator Desks before event start time.
                      </p>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={handleSandboxCodSubmit}
                          disabled={isPayingSim}
                          className="btn-primary animate-pulse-glow"
                          style={{
                            width: "100%",
                            padding: "1rem",
                            fontSize: "1rem",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem"
                          }}
                        >
                          {isVerifying ? (
                            <>
                              <Loader2 size={18} className="animate-spin" /> Reserving Ticket...
                            </>
                          ) : (
                            "Reserve Spot & Pay COD at Booth"
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSandboxStep("method")}
                          style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", padding: "0.5rem" }}
                        >
                          ← Change Payment Method
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 6. Debit/Credit Card Checkout Screen */}
                  {sandboxStep === "card" && (
                    <form onSubmit={handleSandboxCardSubmit} style={{ marginTop: "1rem" }} className="animate-fade-in-up">
                      {/* Visual flipping card */}
                      <div
                        style={{
                          width: "100%",
                          height: "170px",
                          borderRadius: "15px",
                          background: "linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)",
                          padding: "1.25rem 1.5rem",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          color: "#fff",
                          boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)",
                          marginBottom: "1.5rem",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div style={{ position: "absolute", width: "150px", height: "150px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", top: "-50px", right: "-50px" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 800, letterSpacing: "0.08em", fontSize: "0.85rem" }}>CAMPUS PASS</span>
                          <CreditCard size={28} />
                        </div>
                        <div>
                          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "1.15rem", letterSpacing: "0.15em", marginBottom: "0.75rem" }}>
                            {cardNumber || "•••• •••• •••• ••••"}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                            <div>
                              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.55rem", display: "block", textTransform: "uppercase" }}>Card Holder</span>
                              <strong style={{ fontSize: "0.85rem" }}>{cardName.toUpperCase() || "YOUR NAME"}</strong>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.55rem", display: "block", textTransform: "uppercase" }}>Expires</span>
                              <strong style={{ fontSize: "0.85rem" }}>{cardExpiry || "MM/YY"}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Input fields */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.35rem", fontWeight: 600 }}>Card Number</label>
                          <input
                            type="text"
                            placeholder="4111 2222 3333 4444"
                            maxLength={19}
                            className="input"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumStr(e.target.value))}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.35rem", fontWeight: 600 }}>Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="Jane Doe"
                            className="input"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            required
                          />
                        </div>

                        <div style={{ display: "flex", gap: "1rem" }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.35rem", fontWeight: 600 }}>Expiry Date</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              maxLength={5}
                              className="input"
                              style={{ textAlign: "center" }}
                              value={cardExpiry}
                              onChange={(e) => {
                                let v = e.target.value.replace(/[^0-9]/g, "");
                                if (v.length > 2) {
                                  v = `${v.substring(0, 2)}/${v.substring(2, 4)}`;
                                }
                                setCardExpiry(v);
                              }}
                              required
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.35rem", fontWeight: 600 }}>CVV</label>
                            <input
                              type="password"
                              placeholder="•••"
                              maxLength={3}
                              className="input"
                              style={{ textAlign: "center" }}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ""))}
                              required
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isPayingSim}
                          className="btn-primary"
                          style={{
                            width: "100%",
                            padding: "1rem",
                            fontSize: "1rem",
                            fontWeight: 700,
                            marginTop: "0.5rem",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem"
                          }}
                        >
                          {isPayingSim ? (
                            <>
                              <Loader2 size={18} className="animate-spin" /> Transmitting...
                            </>
                          ) : (
                            <>
                              <Lock size={16} /> Pay ₹{totalAmount.toFixed(2)} Securely
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSandboxStep("method")}
                          style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", padding: "0.5rem" }}
                        >
                          ← Change Payment Method
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 7. Card OTP Verification Simulation */}
                  {sandboxStep === "card-otp" && (
                    <form onSubmit={handleCardOtpSubmit} style={{ marginTop: "1rem" }} className="animate-fade-in-up">
                      <div style={{ textAlign: "center", padding: "1rem 0" }}>
                        <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(99,102,241,0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--accent-primary)", marginBottom: "1rem" }}>
                          <Lock size={26} />
                        </div>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.5rem" }}>Card OTP Verification</h4>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", maxWidth: "290px", margin: "0 auto 1.5rem", lineHeight: 1.5 }}>
                          Enter the simulated card transaction OTP code sent to your registered mobile ending in *5678.
                        </p>

                        <div style={{ maxWidth: "200px", margin: "0 auto 1.5rem" }}>
                          <input
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            className="input"
                            style={{ fontSize: "1.3rem", fontWeight: 800, textAlign: "center", letterSpacing: "0.15em", borderColor: "rgba(99, 102, 241, 0.3)" }}
                            value={otpVal}
                            onChange={(e) => setOtpVal(e.target.value.replace(/[^0-9]/g, ""))}
                            required
                          />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <button
                            type="submit"
                            disabled={isPayingSim}
                            className="btn-primary"
                            style={{
                              width: "100%",
                              padding: "1rem",
                              fontSize: "1rem",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.5rem"
                            }}
                          >
                            {isVerifying ? (
                              <>
                                <Loader2 size={18} className="animate-spin" /> Verifying OTP...
                              </>
                            ) : (
                              "Verify & Issue Campus Ticket"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSandboxStep("method")}
                            style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", padding: "0.5rem" }}
                          >
                            ← Back to Selector
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* 🌐 LIVE RAZORPAY COMPONENT DISPLAY */
                <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                  <ShieldCheck size={48} style={{ color: "var(--accent-primary)", marginBottom: "1rem" }} />
                  <h4 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.5rem" }}>Razorpay Gateway Connected</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "300px", margin: "0 auto 1.5rem", lineHeight: 1.5 }}>
                    Click below to open the secure Razorpay Checkout Widget overlay and complete your campus registration payment.
                  </p>

                  {isVerifying ? (
                    <div style={{ padding: "1rem 0" }}>
                      <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent-primary)", margin: "0 auto 1rem" }} />
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Verifying payment signatures, please do not close this window...</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleInitiatePayment}
                      className="btn-primary"
                      style={{
                        width: "100%",
                        padding: "1rem",
                        fontSize: "1rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem"
                      }}
                    >
                      <Lock size={16} /> Open Razorpay Secure Gateway
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
