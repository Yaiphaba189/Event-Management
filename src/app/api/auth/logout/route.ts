import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("user_session");
  return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("user_session");
  const requestUrl = new URL(request.url);
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
