import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  role: "ATTENDEE" | "ORGANIZER" | "ADMIN";
  isApproved: boolean;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("user_session");
    if (!session?.value) return null;
    const parsed = JSON.parse(Buffer.from(session.value, "base64").toString("utf-8"));
    if (!parsed.id || !parsed.email || !parsed.role) return null;
    return parsed as SessionUser;
  } catch (e) {
    return null;
  }
}
