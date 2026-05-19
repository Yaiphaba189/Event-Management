import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed database...");

  // Clean existing data
  await prisma.feedback.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // Create hashed password
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // ─── Create Users ──────────────────────────────────────────────────
  console.log("👤 Creating users...");

  const admin = await prisma.user.create({
    data: {
      name: "Professor Robert Johnson",
      email: "admin@university.edu",
      hashedPassword,
      role: "ADMIN",
    },
  });

  const csOrganizer = await prisma.user.create({
    data: {
      name: "University CS Club",
      email: "cs_club@university.edu",
      hashedPassword,
      role: "ORGANIZER",
    },
  });

  const culturalOrganizer = await prisma.user.create({
    data: {
      name: "Student Cultural Secretary",
      email: "cultural_sec@university.edu",
      hashedPassword,
      role: "ORGANIZER",
    },
  });

  const attendee1 = await prisma.user.create({
    data: {
      name: "Alex Rivera",
      email: "student1@university.edu",
      hashedPassword,
      role: "ATTENDEE",
    },
  });

  const attendee2 = await prisma.user.create({
    data: {
      name: "Chloe Chen",
      email: "student2@university.edu",
      hashedPassword,
      role: "ATTENDEE",
    },
  });

  // ─── Create Events ─────────────────────────────────────────────────
  console.log("📅 Creating university events...");

  const hackathon = await prisma.event.create({
    data: {
      title: "UniHack 2026: Inter-University Hackathon",
      description: "A 36-hour annual national level hackathon hosted by the Computer Science Club. Compete with top teams across the country to solve real-world problems. Tracks include AI for Good, Web3, HealthTech, and Smart Campus. Mentors from major tech companies will be available. Grand prize: $5,000!",
      date: new Date("2026-06-15T09:00:00Z"),
      endDate: new Date("2026-06-16T21:00:00Z"),
      location: "Main Campus, Computing Block",
      venue: "Ada Lovelace Auditorium & Labs",
      category: "WORKSHOP", // Representing Hackathon/Workshop
      capacity: 300,
      price: 0,
      isFeatured: true,
      organizerId: csOrganizer.id,
    },
  });

  const culturalFest = await prisma.event.create({
    data: {
      title: "AURA 2026: National Cultural Festival",
      description: "Experience the biggest national cultural festival of the year! resonance of art, dance, battle of bands, fashion show, and a live closing concert with a top headline artist. Food trucks, local vendors, and student exhibitions will cover the entire campus.",
      date: new Date("2026-06-25T14:00:00Z"),
      endDate: new Date("2026-06-27T23:00:00Z"),
      location: "Main Campus Grounds",
      venue: "Open Air Theater (OAT) & Campus Lawns",
      category: "FESTIVAL",
      capacity: 2000,
      price: 15,
      isFeatured: true,
      organizerId: culturalOrganizer.id,
    },
  });

  const aiSeminar = await prisma.event.create({
    data: {
      title: "Symposium on Generative AI & Career Horizons",
      description: "Distinguished department seminar featuring research presentations and panel discussions from leading AI researchers and industry experts. Learn about advanced prompt engineering, LLM fine-tuning, and how to build a robust tech career in the age of generative AI.",
      date: new Date("2026-07-02T10:00:00Z"),
      endDate: new Date("2026-07-02T15:00:00Z"),
      location: "Science Block B",
      venue: "Seminar Hall room 402",
      category: "SEMINAR",
      capacity: 150,
      price: 0,
      isFeatured: false,
      organizerId: admin.id,
    },
  });

  const roboticsWorkshop = await prisma.event.create({
    data: {
      title: "Autonomous Robotics Design & Programming Workshop",
      description: "A hands-on, multi-day technical workshop on building autonomous ground vehicles using Arduino, Raspberry Pi, and ROS (Robot Operating System). Learn hardware assembly, sensor integration (LiDAR & Sonar), and navigational pathfinding algorithms.",
      date: new Date("2026-07-10T09:00:00Z"),
      endDate: new Date("2026-07-12T17:00:00Z"),
      location: "Engineering Block 2",
      venue: "Mechatronics Lab Room 102",
      category: "WORKSHOP",
      capacity: 60,
      price: 25,
      isFeatured: true,
      organizerId: csOrganizer.id,
    },
  });

  const basketballCup = await prisma.event.create({
    data: {
      title: "Inter-Departmental Basketball Championship",
      description: "Cheer for your department! The annual basketball tournament featuring the best talent on campus. Competitive match-ups, exciting halftime shows, and college pride at stake. High energy guaranteed!",
      date: new Date("2026-05-30T16:00:00Z"),
      endDate: new Date("2026-06-03T20:00:00Z"),
      location: "Sports Complex",
      venue: "Indoor Stadium Basketball Court",
      category: "SPORTS",
      capacity: 500,
      price: 0,
      isFeatured: false,
      organizerId: culturalOrganizer.id,
    },
  });

  const alumniNet = await prisma.event.create({
    data: {
      title: "Campus to Corporate Alumni Networking Evening",
      description: "A premium networking dinner connecting graduating seniors and juniors with top university alumni working in Fortune 500 companies and high-growth startups. Receive resume reviews, interview tips, and potential job referrals.",
      date: new Date("2026-07-18T18:00:00Z"),
      endDate: new Date("2026-07-18T21:30:00Z"),
      location: "Student Center Lounge",
      venue: "Alumni Hall Banquet Room",
      category: "NETWORKING",
      capacity: 120,
      price: 5,
      isFeatured: false,
      organizerId: admin.id,
    },
  });

  // ─── Create Tickets ────────────────────────────────────────────────
  console.log("🎫 Creating tickets...");

  await prisma.ticket.createMany({
    data: [
      { userId: attendee1.id, eventId: hackathon.id, status: "CONFIRMED" },
      { userId: attendee2.id, eventId: hackathon.id, status: "CONFIRMED" },
      { userId: attendee1.id, eventId: culturalFest.id, status: "CONFIRMED" },
      { userId: attendee2.id, eventId: culturalFest.id, status: "CONFIRMED" },
      { userId: attendee1.id, eventId: aiSeminar.id, status: "CONFIRMED" },
      { userId: attendee2.id, eventId: roboticsWorkshop.id, status: "CONFIRMED" },
      { userId: attendee1.id, eventId: basketballCup.id, status: "USED" },
    ],
  });

  // ─── Create Feedbacks ──────────────────────────────────────────────
  console.log("💬 Creating feedback and sentiments...");

  await prisma.feedback.createMany({
    data: [
      {
        userId: attendee1.id,
        eventId: basketballCup.id,
        rating: 5,
        comment: "The match was incredible! Highly organized and fantastic energy from the crowd.",
        sentiment: "POSITIVE",
      },
      {
        userId: attendee2.id,
        eventId: basketballCup.id,
        rating: 3,
        comment: "Decent game but the seating was extremely crowded and unorganized. Hopefully it gets better next time.",
        sentiment: "NEUTRAL",
      },
    ],
  });

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
