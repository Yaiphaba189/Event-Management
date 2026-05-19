import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getSessionUser } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EventAI - AI-Powered Event Management",
  description:
    "Discover, create, and manage events with AI-powered recommendations, attendance prediction, and smart analytics.",
  keywords: [
    "event management",
    "AI events",
    "ticketing",
    "event planning",
    "smart recommendations",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Navbar user={user} />
        <main style={{ flex: 1, paddingTop: "72px" }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
