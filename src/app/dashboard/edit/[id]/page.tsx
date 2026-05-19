import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import EditEventForm from "./EditEventForm";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || (sessionUser.role !== "ADMIN" && sessionUser.role !== "ORGANIZER")) {
    redirect("/events");
  }

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event) {
    notFound();
  }

  // If organizer, ensure they own the event
  if (sessionUser.role === "ORGANIZER" && event.organizerId !== sessionUser.id) {
    redirect("/dashboard");
  }

  // Convert Date objects to ISO strings for the datetime-local input fields
  // datetime-local input expects "YYYY-MM-DDTHH:MM" format
  const formatForInput = (dateObj: Date) => {
    const tzoffset = dateObj.getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(dateObj.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const eventData = {
    ...event,
    date: formatForInput(event.date),
    endDate: event.endDate ? formatForInput(event.endDate) : "",
  };

  return <EditEventForm event={eventData} />;
}
