"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Save } from "lucide-react";

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

interface EditEventFormProps {
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    endDate: string;
    location: string;
    venue: string | null;
    category: string;
    price: number;
    capacity: number;
    image: string | null;
    subEvents: string | null;
  };
}

export default function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description,
    date: event.date,
    endDate: event.endDate,
    location: event.location,
    venue: event.venue || "",
    category: event.category,
    price: event.price,
    capacity: event.capacity,
    image: event.image || "",
  });

  const [subEventsList, setSubEventsList] = useState<{ title: string; time: string; speaker: string }[]>(
    event.subEvents ? JSON.parse(event.subEvents) : []
  );

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
    setError(null);

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          subEvents: subEventsList.length > 0 ? JSON.stringify(subEventsList) : null,
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update event");
      }
    } catch (error) {
      console.error("Failed to update event:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>
          Edit <span className="gradient-text">Event Details</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Modify the fields below to update your event.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "1rem",
            background: "rgba(248, 113, 113, 0.1)",
            border: "1px solid rgba(248, 113, 113, 0.2)",
            borderRadius: "8px",
            color: "#f87171",
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
          }}
        >
          {error}
        </div>
      )}

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
            padding: "1.25rem",
            background: "rgba(99, 102, 241, 0.06)",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(99, 102, 241, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Brain size={16} style={{ color: "var(--accent-primary)" }} />
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>AI Forecasting</span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6 }}>
            Capacity updated to <strong style={{ color: "var(--text-accent)" }}>{formData.capacity}</strong> spots.
            Our predictive attendance models recommend updating social media postings once changes are saved.
          </p>
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
              "Saving..."
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", width: "100%" }}>
                <Save size={16} /> Save Changes
              </span>
            )}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.push("/dashboard")}
            style={{ padding: "0.9rem 1.5rem", fontSize: "0.95rem" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
