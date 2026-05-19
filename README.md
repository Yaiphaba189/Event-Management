# 🏟️ Evently — AI-Powered Event Management System

Evently is an enterprise-grade, full-stack event planning and optimization web application customized for campus demographics (such as **Manipur University**). It integrates a modern Next.js client-server dashboard with a high-performance Python FastAPI machine learning microservice to deliver real-time attendance forecasting, collaborative personalized event suggestions, and participant feedback sentiment intelligence.

---

## 🗺️ High-Level System Architecture

The platform uses a split-architecture design that isolates user-facing client processes from the data-modeling backend. This separation ensures that computationally intensive machine learning tasks (like model retraining and vector calculations) do not block or lag the responsive, low-latency UI.

```mermaid
flowchart TD
    subgraph core ["Client-Server Core (Next.js & PostgreSQL)"]
        UI[React Client Form] <-->|Server Actions / Debounced State| NextAPI[Next.js Server Router]
        NextAPI <-->|Prisma ORM| Postgres[(PostgreSQL Database)]
    end

    subgraph analytics ["Analytical Intelligence Layer (FastAPI Microservice)"]
        FastAPI[FastAPI App on Port 8050]
        Predictor[Gradient Boosting Turnout Model]
        Recommender[Cosine Collaborative Recommender]
        Sentiment[Lexicon-Based Sentiment Parser]
        
        FastAPI --> Predictor
        FastAPI --> Recommender
        FastAPI --> Sentiment
    end

    subgraph fallback_gateway ["Error Handling Gateway"]
        Fallback[Local JS Rule-Based Fallback Engine]
    end

    NextAPI <-->|REST Integration over Port 8050| FastAPI
    NextAPI -.->|If Microservice Unreachable| Fallback
```

### 🔒 Network Isolation & Port Security
* **Next.js Client & Backend**: Runs on Port **3000** (falling back dynamically to Port **3001**).
* **FastAPI ML Microservice**: Runs on Port **8050**. By dedicating Port 8050 to the AI service, we completely avoid port collisions with other FastAPI applications running in the workspace (such as early-warning flood detectors which default to Port 8000).
* **CORS Access Rules**: The Python service blocks requests originating from outside the Next.js frontend origin, protecting inference weights from arbitrary internet access.

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
* **Machine Learning**: **Scikit-learn**, **NumPy**, **Pandas**, **Seaborn**, **Matplotlib**
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
│   ├── plot_metrics.py           # Seaborn training metrics plotting tool
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
├── THESIS_DESIGN.md              # Academic-grade systems design paper
├── .env                          # Local database & auth environment configurations
├── next.config.ts                # Next.js configuration rules
└── package.json                  # Frontend library dependencies manifest
```

---

## 🗄 ... Relational Database & Entity Relationship Modeling

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
        float price "INR - ₹"
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

## 🌟 High-Fidelity Feature Details

### 1. Zero-Overbooking Checkout Pipeline
During ticket booking, the transactional pipeline checks target capacity constraints in real-time, preventing overbooking:
$$\text{Tickets Issued} = \text{count}(\text{Tickets WHERE } \text{eventId} = E \text{ AND } \text{status} = \text{CONFIRMED})$$
If $\text{Tickets Issued} \ge \text{Capacity}$, registration is safely blocked. A unique **CUID** ticket is generated upon booking completion (e.g., `ticket_cuid12345`) to map checking logs.

### 2. Dynamic Agenda Coordinator
Supports multi-track scheduling without child table bloat by serializing dynamic agenda schedules into a single `JSON` string inside the PostgreSQL database (containing sub-event titles, durations, and speakers). The frontend parses this array and renders it dynamically.

### 3. Asynchronous Debounced Predictor UI
A React hook implements a **600ms debounce** while organizers create events. This captures pricing, category, format, and capacity configurations, presenting expected turnout rates via a modern glassmorphic interface with vibrant progress bars and factor badges.

---

## 🧠 Machine Learning Engine Architecture

### 1. Attendance Predictor (Gradient Boosting Regression)
* **Mathematical Theory**: Sequentially fits decision trees ($M=100$) to minimize Mean Squared Error (MSE) loss on pseudo-residuals:
  $$r_{im} = y_i - F_{m-1}(X_i)$$
* **Student Price Elasticity (INR - ₹)**:
  - **₹0 (Free)**: `1.25x` turnout multiplier.
  - **₹1 - ₹199 (Cheap)**: `1.10x` turnout multiplier.
  - **₹200 - ₹500 (Moderate)**: `0.98x` turnout multiplier.
  - **> ₹500 (Premium)**: `0.75x` turnout multiplier (friction threshold).
* **Calendar & Format Constraints**: Weekdays are favored (`1.0x` vs `0.88x` weekends), and online format removes commuting friction (`1.05x` turnout boost).
* **Metrics**: $R^2 = 0.91$, MAE $= 0.035$, RMSE $= 0.045$.

### 2. Personalized Event Recommendations
* **Mechanism**: Maps a user interest preference profile vector $\vec{u}$ against current active event category vectors $\vec{e}$ using Cosine Similarity, plus random noise variables $\epsilon \sim \mathcal{U}(-0.05, 0.05)$ to prevent recommendations fatigue.
* **Cold Start**: New profiles are initialized with neutral vectors $\vec{u}_{new} = [0.5, 0.5, 0.5, 0.5]$ to rank events fairly until registrations accumulate.

### 3. Feedback Sentiment NLU Engine
* Parses review comments dynamically. Identifies emotional keywords, tracks grammatical negation inversion rules (e.g. *"not bad"* increases positive ratings), and applies intensifiers (e.g. *"very excellent"* multiplies score by `1.5x`). Outputs POSITIVE, NEGATIVE, or NEUTRAL classes and stores them in PostgreSQL.

---

## 🚀 Local Quickstart Guide

Ensure you have **Node.js 18+**, **Python 3.10+**, **uv**, and **PostgreSQL** running.

### Part 1: Setting Up the Next.js Client & Backend

1. **Install Node Dependencies**:
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
   # Syncs dataset and compiles attendance_model.pkl
   ./.venv/bin/python train_now.py
   ```

3. **Plot Analytical Metrics**:
   To generate training convergence and feature importance charts with Seaborn, run:
   ```bash
   ./.venv/bin/python plot_metrics.py
   ```

4. **Start the Uvicorn Server** (running on port **8050**):
   ```bash
   uv run uvicorn main:app --reload --port 8050
   ```
   *API documentation will load at: `http://127.0.0.1:8050/docs`.*

---

## 🔮 Core System Enhancements Roadmap

### 1. Closed-Loop Online Learning Feedback
* COUNT verified active tickets (`status = CONFIRMED`) in PostgreSQL nightly using a cron job, sending training updates back to the Python microservice `/train` endpoint to dynamically recalibrate model weights.

### 2. Deep Learning NLP
* Replace rule-based lexicon parsing with a pre-trained, fine-tuned transformer model (`distilbert-base-uncased-finetuned-sst-2-english`) running locally inside the FastAPI container.

### 3. Multi-role Organiser Validation
* Administrative consoles to audit predicted turnout rates against physical capacities before giving structural validation approvals.
