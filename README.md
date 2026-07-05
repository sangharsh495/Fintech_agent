<<<<<<< HEAD
# Fintech_agent
=======
# 🚀 Fintech Dashboard & Wealth Manager

A modern, high-performance financial management platform built with Next.js 15, React 19, and Tailwind CSS v4. This platform provides users with powerful tools to track net worth, optimize taxes, calculate complex financial projections, and interact with an AI-powered Chartered Accountant (CA).

---

## 🌟 Key Features

### 1. 📊 Interactive Financial Dashboard
- **Real-time Analytics:** Track income, expenses, and savings rates with dynamic glassmorphic UI components.
- **Smart Alerts:** Automated insights and notifications about unusual spending or investment opportunities.
- **Net Worth Tracking:** Visual performance reporting using interactive Recharts components.

### 2. 🧮 Universal Calculators Platform
A comprehensive suite of 30+ financial calculators built on a Custom Universal Engine.
- **Hybrid Data Entry:** Features both highly precise number inputs and draggable sliders side-by-side for an optimal professional UX.
- **Dynamic Visualizations:** Toggle instantly between smooth compounding **Area Charts** and clustered **Bar Charts**.
- **Essential Tools:** Deep interactive modules for EMI, SIP, Fixed Deposits (FD), and Recurring Deposits (RD) with multi-compounding math logic.
- **Adaptive UI:** Clean "How it works" descriptions that update dynamically based on the active calculator.

### 3. 🤖 AI Virtual Chartered Accountant (CA)
- **Generative AI Integration:** Powered by `@ai-sdk/google` and `@ai-sdk/openai`, providing personalized tax and financial planning advice.
- **Document Processing:** Secure upload and intelligent parsing of financial PDFs (`pdf-parse`) and CSV exports (`papaparse`).

### 4. 🗄️ Secure Data Management & Authentication
- **Next-Auth System:** Robust security for user login and session management.
- **Drizzle ORM & Postgres:** Lightning-fast serverless database operations with Neon.
- **User Datasets:** All user details submitted via the registration flow are persisted to the database and manageable via the settings view.
- **Structured Finance Tracking:** Users can log and track recurring transactions, static assets, and liabilities tied directly to their authenticated session, ensuring their dashboard updates with their personal dataset.
- **AWS S3 Storage:** Secure document vault for storing past tax returns, slips, and financial statements.
- **Rate Limiting:** Enterprise-grade API protection using `@upstash/redis` and `@upstash/ratelimit`.

---

## 🛠️ Technology Stack

### Core Frameworks
- **[Next.js 15 App Router](https://nextjs.org/)** (Server Components, API Routes)
- **[React 19](https://react.dev/)**
- **[TypeScript 5](https://www.typescriptlang.org/)**

### UI / Styling / Components
- **[Tailwind CSS v4](https://tailwindcss.com/)**
- **[shadcn/ui](https://ui.shadcn.com/)** (Radix UI Primitives)
- **[Recharts](https://recharts.org/)** (Interactive Data Visualizations)
- **[Lucide React](https://lucide.dev/)** (Icon System)
- **[Framer Motion / Tailwind Animate]** (Micro-interactions and Glassmorphism)

### Backend & Database
- **[Drizzle ORM](https://orm.drizzle.team/)** (Type-safe SQL schema)
- **[Neon Serverless Postgres](https://neon.tech/)**
- **[tRPC setup](https://trpc.io/)** (End-to-end typesafe APIs)

### Utilities & AI
- **[Vercel AI SDK](https://sdk.vercel.ai/docs)**
- **[Zod](https://zod.dev/)** (Schema validation)
- **[React Hook Form](https://react-hook-form.com/)** (Form state management)
- **[Zustand](https://zustand-demo.pmnd.rs/)** (Global State Management)

---

## ⚙️ Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- Node.js (v18 or higher)
- npm or pnpm
- A local or cloud Postgres database (Neon recommended)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd fintech-app
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add the required keys:
```env
# Database
DATABASE_URL="postgres://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# AI Providers (If using AI CA feature)
GOOGLE_API_KEY="..."
OPENAI_API_KEY="..."

# AWS S3 (for Document Uploads)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="..."
AWS_S3_BUCKET_NAME="..."

# Redis / Upstash (for Rate Limiting)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### 4. Database Setup
Push the Drizzle schema to your database:
```bash
npx drizzle-kit push
```

### 5. Running the Application
Start the development server:
```bash
npm run dev
```
Navigate to `http://localhost:3000` to view the app.

---

## 🎨 UI & Design Principles
- **Modern Glassmorphism:** Utilization of blurs (`backdrop-blur`), semi-transparent overlays, and dynamic gradient lighting to create depth.
- **Accessibility:** Use of Radix UI primitives ensures full keyboard navigation and screen-reader support.
- **Responsive:** Fluidly scales from wide desktop dashboards down to mobile views.
>>>>>>> adb05da (docs: Add project README with setup instructions)
