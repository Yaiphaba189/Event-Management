"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Brain, Rocket, Sparkles, TrendingUp, TrendingDown, Info } from "lucide-react";

const categories = [
  "CONFERENCE",
  "WORKSHOP",
  "SEMINAR",
  "WEBINAR",
  "CONCERT",
  "FESTIVAL",
  "SPORTS",
  "NETWORKING",
  "OTHER",
];

export default function CreateEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    location: "",
    venue: "",
    category: "CONFERENCE",
    price: 0,
    capacity: 100,
    image: "",
  });

  const [subEventsList, setSubEventsList] = useState<{ title: string; time: string; speaker: string }[]>([]);
  const [prediction, setPrediction] = useState<{
    expectedAttendance: number;
    predictedRate: number;
    confidence: number;
    source: string;
    factors?: { name: string; value?: string; impact: string; weight: number }[];
  } | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  useEffect(() => {
    // Only predict if we have category and capacity
    if (!formData.category || formData.capacity <= 0) return;

    const delayDebounce = setTimeout(async () => {
      setIsPredicting(true);
      try {
        const jsDay = formData.date ? new Date(formData.date).getDay() : 3;
        const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
        const isOnline = formData.category === "WEBINAR" || 
          (formData.location && formData.location.toLowerCase().includes("online")) || 
          (formData.location && formData.location.toLowerCase().includes("virtual")) ||
          (formData.venue && formData.venue.toLowerCase().includes("online")) ||
          (formData.venue && formData.venue.toLowerCase().includes("virtual"));

        const res = await fetch("/api/ai/predict-attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: formData.category,
            price: formData.price,
            capacity: formData.capacity,
            dayOfWeek,
            isOnline,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.prediction) {
            setPrediction({
              expectedAttendance: data.prediction.expectedAttendance !== undefined ? data.prediction.expectedAttendance : data.prediction.expected_attendance,
              predictedRate: data.prediction.predictedRate !== undefined ? data.prediction.predictedRate : data.prediction.predicted_rate,
              confidence: data.prediction.confidence,
              source: data.prediction.source || data.source || "FastAPI ML Microservice (Gradient Boosting)",
              factors: data.prediction.factors,
            });
          }
        }
      } catch (err) {
        console.error("Prediction error:", err);
      } finally {
        setIsPredicting(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [formData.category, formData.price, formData.capacity, formData.date, formData.location, formData.venue]);

  const handleAddSubEvent = () => {
    setSubEventsList((prev) => [...prev, { title: "", time: "", speaker: "" }]);
  };

  const handleRemoveSubEvent = (index: number) => {
    setSubEventsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubEventChange = (index: number, field: string, value: string) => {
    setSubEventsList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "capacity" ? Number(value) : value,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, image: data.url }));
      } else {
        alert("Failed to upload image. Please try again.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          subEvents: subEventsList.length > 0 ? JSON.stringify(subEventsList) : null,
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to create event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>
          Create <span className="gradient-text">New Event</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Fill in the details to publish your event.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass"
        style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        {/* Title */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "0.4rem",
              color: "var(--text-secondary)",
            }}
          >
            Event Title *
          </label>
          <input
            type="text"
            name="title"
            className="input"
            placeholder="e.g., AI & Machine Learning Summit 2026"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "0.4rem",
              color: "var(--text-secondary)",
            }}
          >
            Description *
          </label>
          <textarea
            name="description"
            className="input"
            placeholder="Describe your event..."
            value={formData.description}
            onChange={handleChange}
            required
            rows={5}
            style={{ resize: "vertical", minHeight: "120px" }}
          />
        </div>

        {/* Image URL & File Upload */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
                color: "var(--text-secondary)",
              }}
            >
              Event Banner Image URL
            </label>
            <input
              type="text"
              name="image"
              className="input"
              placeholder="Paste image link, or upload one"
              value={formData.image}
              onChange={handleChange}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
                color: "var(--text-secondary)",
              }}
            >
              Upload Local Image
            </label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                id="image-file-upload"
              />
              <label
                htmlFor="image-file-upload"
                className="btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: "0.75rem 1rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  width: "100%",
                  textAlign: "center",
                }}
              >
                {isUploading ? "Uploading Banner..." : "Choose Image File"}
              </label>
            </div>
          </div>
        </div>

        {/* Image Preview Box */}
        {formData.image && (
          <div style={{ marginTop: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>
              Image Banner Preview:
            </span>
            <div
              style={{
                width: "100%",
                height: "180px",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                backgroundImage: `url(${formData.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "1px solid var(--border-color)",
              }}
            />
          </div>
        )}

        {/* Date Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
                color: "var(--text-secondary)",
              }}
            >
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              name="date"
              className="input"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
                color: "var(--text-secondary)",
              }}
            >
              End Date & Time
            </label>
            <input
              type="datetime-local"
              name="endDate"
              className="input"
              value={formData.endDate}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Location Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
                color: "var(--text-secondary)",
              }}
            >
              Location *
            </label>
            <input
              type="text"
              name="location"
              className="input"
              placeholder="City, State"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
                color: "var(--text-secondary)",
              }}
            >
              Venue
            </label>
            <input
              type="text"
              name="venue"
              className="input"
              placeholder="Venue name"
              value={formData.venue}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Category, Price, Capacity */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
                color: "var(--text-secondary)",
              }}
            >
              Category *
            </label>
            <select
              name="category"
              className="input"
              value={formData.category}
              onChange={handleChange}
              style={{ cursor: "pointer" }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
                color: "var(--text-secondary)",
              }}
            >
              Price (₹)
            </label>
            <input
              type="number"
              name="price"
              className="input"
              min={0}
              value={formData.price}
              onChange={handleChange}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.4rem",
                color: "var(--text-secondary)",
              }}
            >
              Capacity
            </label>
            <input
              type="number"
              name="capacity"
              className="input"
              min={1}
              value={formData.capacity}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Dynamic Sub-Events */}
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Program Sub-Events & Agenda</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.15rem" }}>
                Add individual sessions, parallel tracks, or key program activities.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSubEvent}
              className="btn-secondary"
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
            >
              + Add Sub-Event
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {subEventsList.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr auto",
                  gap: "0.75rem",
                  alignItems: "end",
                  background: "rgba(255, 255, 255, 0.02)",
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Sub-Event Title *
                  </label>
                  <input
                    type="text"
                    className="input"
                    style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
                    placeholder="e.g., Opening Remarks"
                    value={item.title}
                    onChange={(e) => handleSubEventChange(index, "title", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Time Slot / Duration *
                  </label>
                  <input
                    type="text"
                    className="input"
                    style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
                    placeholder="e.g., 09:00 AM - 09:30 AM"
                    value={item.time}
                    onChange={(e) => handleSubEventChange(index, "time", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Speaker / Host / Venue
                  </label>
                  <input
                    type="text"
                    className="input"
                    style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
                    placeholder="e.g., Prof. Robert J."
                    value={item.speaker}
                    onChange={(e) => handleSubEventChange(index, "speaker", e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSubEvent(index)}
                  style={{
                    background: "rgba(248, 113, 113, 0.1)",
                    border: "1px solid rgba(248, 113, 113, 0.2)",
                    color: "#f87171",
                    borderRadius: "6px",
                    padding: "0.4rem 0.75rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Delete
                </button>
              </div>
            ))}

            {subEventsList.length === 0 && (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.85rem", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)" }}>
                No sub-events added. Your event will run as a single main program.
              </div>
            )}
          </div>
        </div>

        {/* AI Prediction Preview */}
        <div
          style={{
            padding: "1.5rem",
            background: "rgba(99, 102, 241, 0.05)",
            borderRadius: "var(--radius-lg, 12px)",
            border: "1px solid rgba(99, 102, 241, 0.15)",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s ease",
          }}
        >
          {/* Decorative glowing gradient */}
          <div
            style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "150px",
              height: "150px",
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Brain size={20} style={{ color: "var(--accent-primary)", animation: isPredicting ? "pulse 1.5s infinite" : "none" }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  Real-time AI Attendance Prediction 
                  <Sparkles size={14} style={{ color: "#facc15" }} />
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>
                  Powered by Manipur University campus-trained ML model
                </span>
              </div>
            </div>
            
            {isPredicting && (
              <span style={{
                fontSize: "0.75rem",
                color: "var(--accent-primary)",
                background: "rgba(99, 102, 241, 0.1)",
                padding: "0.2rem 0.6rem",
                borderRadius: "100px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem"
              }}>
                <span style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent-primary)",
                  display: "inline-block"
                }} />
                AI is thinking...
              </span>
            )}
          </div>

          {prediction ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem", alignItems: "center" }}>
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                    Based on event parameters, we predict approximately{" "}
                    <strong style={{ color: "var(--text-accent)", fontSize: "1.25rem", fontWeight: 800 }}>
                      {prediction.expectedAttendance}
                    </strong>{" "}
                    attendees (
                    <strong style={{ color: "var(--text-primary)" }}>{prediction.predictedRate}%</strong> of capacity).
                  </p>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem" }}>
                    <span style={{
                      fontSize: "0.7rem",
                      background: "rgba(34, 197, 94, 0.1)",
                      color: "var(--success)",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "4px",
                      fontWeight: 600
                    }}>
                      {prediction.confidence}% Confidence
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      Source: {prediction.source.split(" (")[0]}
                    </span>
                  </div>
                </div>

                {/* Progress bar and rating indicator */}
                <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.3rem" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Expected Turnout</span>
                    <strong style={{ color: "var(--accent-primary)" }}>{prediction.predictedRate}%</strong>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "100px", overflow: "hidden" }}>
                    <div style={{
                      width: `${prediction.predictedRate}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, var(--accent-primary) 0%, #10b981 100%)",
                      borderRadius: "100px",
                      transition: "width 0.5s ease"
                    }} />
                  </div>
                </div>
              </div>

              {/* Factors list */}
              {prediction.factors && prediction.factors.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
                    Top Influencing Factors:
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    {prediction.factors.map((factor, index) => {
                      const isPositive = factor.impact === "positive";
                      const isNegative = factor.impact === "negative";
                      const badgeBg = isPositive 
                        ? "rgba(34, 197, 94, 0.08)" 
                        : isNegative 
                          ? "rgba(239, 68, 68, 0.08)" 
                          : "rgba(255, 255, 255, 0.03)";
                      const badgeColor = isPositive 
                        ? "var(--success)" 
                        : isNegative 
                          ? "#ef4444" 
                          : "var(--text-muted)";
                      const ImpactIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Info;

                      return (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.4rem 0.6rem",
                            borderRadius: "6px",
                            background: badgeBg,
                            border: `1px solid ${isPositive ? "rgba(34, 197, 94, 0.12)" : isNegative ? "rgba(239, 68, 68, 0.12)" : "var(--border-color)"}`,
                          }}
                        >
                          <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                            {factor.name}
                          </span>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.2rem",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            color: badgeColor
                          }}>
                            <ImpactIcon size={12} />
                            {factor.impact.toUpperCase()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                Based on your event details, our AI predicts approximately{" "}
                <strong style={{ color: "var(--text-accent)" }}>
                  {Math.round(formData.capacity * 0.78)}
                </strong>{" "}
                attendees with{" "}
                <strong style={{ color: "var(--success)" }}>87%</strong> confidence.
                This will be refined dynamically as you fill in details!
              </p>
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: "1rem", paddingTop: "0.5rem" }}>
          <button
            type="submit"
            className="btn-primary"
            style={{
              flex: 1,
              padding: "0.9rem",
              fontSize: "0.95rem",
              opacity: isLoading ? 0.7 : 1,
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              "Publishing..."
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", width: "100%" }}>
                <Rocket size={16} /> Publish Event
              </span>
            )}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.back()}
            style={{ padding: "0.9rem 1.5rem", fontSize: "0.95rem" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
