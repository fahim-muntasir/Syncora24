# Syncora24 — Full-Stack Real-Time Language Practice Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-98%25-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://syncora24-frontend.vercel.app)

> **Practice Speaking With Real People.**
>
> A full-stack real-time language practice platform where users connect through live voice conversations and text chat to improve their speaking skills in interactive rooms.

**Live Demo:** https://syncora24-frontend.vercel.app

---

## Live Services

| Service | URL |
|----------|-----|
| Frontend | https://syncora24-frontend.vercel.app |
| Backend API | https://syncora24.onrender.com/api/health |

> [!NOTE]
> **Project History**
>
> Syncora24 is an evolution of my earlier **QuizVerse** frontend and backend projects. I refactored the codebase into a Turborepo monorepo, removed the quiz functionality, redesigned the architecture, and rebuilt it as a real-time language practice platform with voice communication and live chat. The project is now focused on helping people practice speaking with real people.
>
> Previous repositories:
> - QuizVerse (Frontend): https://github.com/fahim-muntasir/quizVerse
> - QuizVerse Backend: https://github.com/fahim-muntasir/quizVerse-backend

## About

Syncora24 is a full-stack real-time language practice platform designed to help people improve their speaking skills through live interaction with others. Users can join practice rooms, communicate using real-time text messaging and voice conversations, and participate in low-latency collaborative sessions.

The project is built with a modern Turborepo monorepo architecture, featuring separate Next.js frontend and Express.js backend applications. It leverages Socket.IO for real-time communication, WebRTC for voice calling, JWT-based authentication for secure access, and Docker for containerized development and deployment.

The project emphasizes scalable architecture, real-time communication, and modern full-stack development practices.

## Screenshots

| Landing Page | Practice Room | Room Details |
|---|---|---|
| ![Landing](./docs/screenshots/landing-page.png) | ![Room](./docs/screenshots/room.png) | ![Room-details](./docs/screenshots/room-details.png) |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Redux Toolkit, Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript, MVC Architecture |
| Real-Time | WebRTC, Socket.io |
| Database | MongoDB |
| Cache | Redis |
| Auth | JWT (Access + Refresh tokens) |
| DevOps | Docker, Docker Compose, CI/CD |
| Monorepo | Turborepo, pnpm workspaces |

## Project Structure

```text
syncora24/
├── apps/
│   ├── frontend/              # Next.js (App Router) frontend
│   └── backend/               # Express.js REST API & Socket.IO server
│
├── packages/                  # Shared packages and configurations
│
├── docs/                      # Project documentation
│
├── docker-compose.yaml        # Multi-container Docker configuration
├── turbo.json                 # Turborepo pipeline configuration
├── pnpm-workspace.yaml        # PNPM workspace configuration
├── package.json               # Root workspace scripts and dependencies
├── .gitignore
└── README.md
```

## Architecture

```text
                        +----------------------+
                        |  Next.js Frontend    |
                        +----------------------+
                           │              │
          REST API         │              │ Socket.IO
        (CRUD Requests)    │              │ (Real-Time Events)
                           ▼              ▼
                  +-------------------------------+
                  |   Express.js Backend          |
                  |  REST API + Socket.IO Server  |
                  +-------------------------------+
                           │              │
                           │              │
                           ▼              ▼
                    +-------------+   +-------------+
                    |  MongoDB    |   |    Redis    |
                    | Application |   | Room State  |
                    |    Data     |   | & Caching   |
                    +-------------+   +-------------+

          WebRTC (Peer-to-Peer Audio Streams)
        Client ◄────────────────────────────► Client
                 (Signaling via Socket.IO)
```

The frontend communicates with the backend through REST APIs for authentication and data management, while Socket.IO delivers real-time events such as room updates, messaging, and signaling. WebRTC establishes direct peer-to-peer audio connections between participants, with Socket.IO handling the signaling process. MongoDB stores application data, and Redis manages shared room state and caching to support low-latency real-time communication.

## Deployment

| Service | Platform |
|----------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Cache | Redis Cloud |

## Key Features

- **Real-Time Voice Rooms** — Low-latency voice communication powered by WebRTC with Socket.IO signaling.
- **Live Room Chat** — Instant text messaging within practice rooms.
- **Secure Authentication** — JWT-based authentication with access and refresh token support.
- **Room Management** — Create, join, and manage language practice rooms in real time.
- **Redis Integration** — Fast room state management and caching for scalable real-time communication.
- **Monorepo Architecture** — Organized using Turborepo with separate frontend and backend applications.
- **Containerized Development** — Docker Compose for consistent local development and deployment.
- **Modern Full-Stack Stack** — Built with Next.js, Express.js, TypeScript, MongoDB, Redis, Socket.IO, and WebRTC.

---

## Getting Started

### Prerequisites

Before running the project, ensure you have the following installed:

- Node.js **20+**
- pnpm
- Docker & Docker Compose

Install pnpm if needed:

```bash
npm install -g pnpm
```

---

### Installation

Clone the repository and install all workspace dependencies.

```bash
# Clone the repository
git clone https://github.com/fahim-muntasir/Syncora24.git

# Navigate to the project
cd Syncora24

# Install dependencies
pnpm install
```

Create the required environment files:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Update the environment variables with your local configuration before running the application.

---

### Run Project

Start necessary services with Docker Compose:

```bash
docker-compose up --build
```

This will start only Redis for now:

<!-- - Frontend (Next.js)
- Backend (Express.js)
- MongoDB -->
- Redis

Run the entire monorepo:

```bash
pnpm dev
```

Or start individual applications:

```bash
pnpm --filter frontend dev
pnpm --filter backend dev
```

---

## Available Scripts

| Command | Description |
|----------|-------------|
| `pnpm dev` | Start all applications in development mode |
| `pnpm build` | Build all workspaces |
| `pnpm lint` | Run ESLint across all workspaces |
| `pnpm format` | Format source code *(if configured)* |

---

## Links

- **Live Demo:** https://syncora24-frontend.vercel.app
- **Frontend Documentation:** `apps/frontend/README.md`
- **Backend Documentation:** `apps/backend/README.md`
- **GitHub Repository:** https://github.com/fahim-muntasir/Syncora24

---

## Author 

- GitHub: https://github.com/fahim-muntasir
- LinkedIn: https://linkedin.com/in/fahim-muntasir0909

---

## License

MIT