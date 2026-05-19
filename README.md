# 🏟️ Evently — AI-Powered Event Management System

Evently is an enterprise-grade, full-stack event planning and engagement web application customized for campus demographics (like **Manipur University**). It integrates a modern Next.js client-server dashboard with a high-performance Python FastAPI machine learning microservice to deliver real-time attendance forecasting, collaborative personalized event suggestions, and participant feedback sentiment intelligence.

---

## 🚀 Key Architectural Layout

The platform uses a split-architecture design:
1. **Frontend & DB Gateway**: Next.js (App Router), Tailwind CSS, PostgreSQL, and Prisma ORM.
2. **AI Microservice**: FastAPI, Scikit-learn, Pandas, NumPy, and Uvicorn running on Port 8050 (to prevent early-warning system collisions on Port 8000).

```mermaid
graph LR
    subgraph Client-Server Architecture
        NextClient[Next.js Client Page] <-->|Server Actions / Fetch| NextServer[Next.js API Handler]
        NextServer <-->|Prisma Client| Postgres[(PostgreSQL DB)]
    end

    subgraph AI Intelligence Layer
        NextServer <-->|REST Requests on Port 8050| FastAPI[FastAPI Microservice]
        FastAPI <-->|Gradient Boosting Weights| PickledModel[attendance_model.pkl]
    end
```

---

## 🛠️ Complete Technology Stack

### 💻 Frontend Client
* **Core Framework**: **Next.js 16 (App Router)** & **React 19**
* **Styling**: **Tailwind CSS** (v4) & Vanilla CSS Glassmorphism
* **Icons**: **Lucide React**
* **State Management**: React Context & local hook states

### ⚙️ Database & API Middleware
* **Database Engine**: **PostgreSQL**
* **ORM Engine**: **Prisma ORM**
* **Authentication**: **NextAuth.js** (Credentials Provider, role-based controls)
* **API Handler**: Next.js route handlers (`NextResponse`)

### 🧠 Python AI Microservice
* **Core Engine**: **FastAPI**
* **Machine Learning**: **Scikit-learn**, **NumPy**, **Pandas**
* **Runtime / Deployment**: **uv** (virtualenv manager), **Uvicorn**, **Docker**

---

## 📂 Project Directory Structure

```text
Event-Management/
├── ai-service/                   # FastAPI Python ML Microservice
│   ├── models/                   # Machine learning models & picklings
│   │   ├── attendance_predictor.py
│   │   ├── recommendation.py
│   │   └── sentiment_analyzer.py
│   ├── main.py                   # FastAPI entrypoint
│   ├── train_now.py              # ML retraining execution script
│   └── README.md                 # Detailed AI documentation
├── prisma/                       # Database schema & seeding configurations
│   ├── schema.prisma             # PostgreSQL relationships definitions
│   └── seed.ts                   # Dummy user/event database seeder
├── public/                       # Local static files & graphic assets
├── src/                          # Next.js frontend app source code
│   ├── app/                      # Next.js App Router directories
│   │   ├── api/                  # Backend endpoints (proxying requests to AI)
│   │   │   ├── ai/               # AI endpoint redirects (e.g. /predict-attendance)
│   │   │   ├── events/           # Event CRUD routes
│   │   │   └── tickets/          # Ticket registration actions
│   │   ├── auth/                 # Sign-in and registration pages
│   │   ├── dashboard/            # Attendee / Organiser / Admin panel views
│   │   └── events/               # Event detail profiles & registration checkout
│   ├── components/               # High-fidelity reusable React components
│   │   ├── ui/                   # Reusable atomic UI buttons & layouts
│   │   └── dashboard/            # Dynamic organizer review panels & lists
│   └── middleware.ts             # Route guard middleware
├── .env                          # Local database & auth environment configurations
├── next.config.ts                # Next.js configuration rules
└── package.json                  # Frontend library dependencies manifest
```

---

## 🗄️ Database Architecture & Prisma Schema

The platform implements five interconnected relational tables designed for quick queries and strong integrity constraints:

```mermaid
erDiagram
    USER ||--o{ ACCOUNT : "possesses"
    USER ||--o{ SESSION : "starts"
    USER ||--o{ EVENT : "organizes"
    USER ||--o{ TICKET : "registers"
    USER ||--o{ FEEDBACK : "submits"
    EVENT ||--o{ TICKET : "issues"
    EVENT ||--o{ FEEDBACK : "collects"

    USER {
        string id PK
        string name
        string email UK
        string hashedPassword
        Role role "ATTENDEE | ORGANIZER | ADMIN"
        boolean isApproved
    }

    EVENT {
        string id PK
        string title
        string description
        datetime date
        string location
        Category category "CONFERENCE | WORKSHOP | CONCERT | WEBINAR..."
        int capacity
        float price
        EventStatus status "UPCOMING | ONGOING | COMPLETED"
        string organizerId FK
    }

    TICKET {
        string id PK
        string ticketNo UK
        TicketStatus status "CONFIRMED | CANCELLED | USED"
        string userId FK
        string eventId FK
    }

    FEEDBACK {
        string id PK
        int rating "1 to 5"
        string comment
        string sentiment "POSITIVE | NEGATIVE | NEUTRAL"
        string userId FK
        string eventId FK
    }
```

---

## 🌟 Smart AI Features

### 1. Real-time Attendance Prediction
* **Flow**: When an organizer changes event configurations (pricing, category, venue capacity, format) on the creation dashboard, an asynchronous, debounced request is sent to the FastAPI `/predict-attendance` endpoint.
* **Algorithm**: **Gradient Boosting Regressor** trained on typical student budget profiles in **Indian Rupees (INR - ₹)**:
  - Ticket prices under **₹200** register as highly positive student turnout enhancers.
  - Ticket prices above **₹500** apply steep attendance rate penalties.
* **Fallback**: The Next.js API route includes a local, rule-based mathematical simulator that mirrors the model in case the microservice is offline, maintaining a continuous user experience.

### 2. Tailored Collaborative Event Recommendations
* Cosine similarity computations identify correlations between attendee interest categories (e.g. *Tech Workshop*, *Sangai Music Festival*) and their historical registration profiles to build user recommendations.

### 3. Automated Review Sentiment Categorization
* When a user posts an event review, the text is evaluated by a rule engine (negation tracking and intensifiers) inside `sentiment_analyzer.py`, identifying if the review is `POSITIVE`, `NEGATIVE`, or `NEUTRAL` before saving it into the PostgreSQL database.

---

## 🚀 Local Quickstart Guide

Ensure you have **Node.js 18+**, **Python 3.10+**, **uv**, and a **PostgreSQL** instance ready.

### Part 1: Setting Up the Next.js Client & Backend

1. **Navigate and Install Node Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```ini
   DATABASE_URL="postgresql://username:password@localhost:5432/evently_db?schema=public"
   NEXTAUTH_SECRET="your-super-secret-sign-key"
   NEXTAUTH_URL="http://localhost:3000"
   AI_SERVICE_URL="http://localhost:8050"
   ```

3. **Synchronize & Seed PostgreSQL Database**:
   ```bash
   # Push Prisma schema definitions to PostgreSQL
   npx prisma db push

   # Seed the database with sample organizers, attendees, and events
   npx prisma db seed
   ```

4. **Launch Next.js Server**:
   ```bash
   npm run dev
   ```
   *Next.js will load at: `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied).*

---

### Part 2: Setting Up the FastAPI AI Microservice

1. **Navigate and Sync Python Environment**:
   ```bash
   cd ai-service
   uv sync
   ```

2. **Run Model Training**:
   Before starting the server, run the training pipeline to generate the serialized Scikit-learn model:
   ```bash
   # Automatically syncs dataset and compiles attendance_model.pkl
   ./.venv/bin/python train_now.py
   ```

3. **Start the Uvicorn Server** (running on port **8050**):
   ```bash
   uv run uvicorn main:app --reload --port 8050
   ```
   *API documentation will load at: `http://127.0.0.1:8050/docs`.*

---

## 🔮 Core System Enhancements Roadmap

### 1. Nightly Feedback & Weight Drifts (Online Learning)
* **Goal**: Retrain the turnout predictor model automatically based on real-world events.
* **Mechanism**: Deploy a nightly node-cron or GitHub Action that counts actual registrations (`status = CONFIRMED`) in PostgreSQL and sends them as coordinates to the Python `/train` endpoint to update the `.pkl` file.

### 2. Fine-Tuning deep NLP models
* **Goal**: Transition feedback reviews parsing from keywords matching to state-of-the-art NLP models.
* **Mechanism**: Download and deploy a quantized, local Hugging Face transformer model (e.g. `distilbert-base-uncased-finetuned-sst-2-english`) within the FastAPI environment.

### 3. Multi-role Organiser Workflow approvals
* **Goal**: Enhance platform governance.
* **Mechanism**: Admin dashboards that monitor organization requests, evaluate student turnout predictions, and toggle organizers' `isApproved` flags dynamically using PostgreSQL/Prisma updates.
