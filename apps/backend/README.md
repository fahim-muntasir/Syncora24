# Syncora24 — Backend

Backend API and real-time server for **Syncora24**, built with **Express.js**, **TypeScript**, **MongoDB**, **Redis**, **Socket.IO**

**Live Demo:** https://syncora24.onrender.com/api/health

---

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis
- **Authentication:** JWT
- **Real-Time:** Socket.IO + WebRTC Signaling
- **Architecture:** MVC
- **Containerization:** Docker
- **Deployment:** Render

---

## Folder Structure

```text
backend/
├── src/
│   ├── api/                # API modules
│   ├── app/                # Express app configuration
│   ├── db/                 # Database connection
│   ├── lib/                # Shared libraries
│   ├── middleware/         # Custom middleware
│   ├── models/             # Database models
│   ├── redis/              # Redis configuration
│   ├── routes/             # API routes
│   ├── schemas/            # Validation schemas
│   ├── socket/             # Socket.IO handlers
│   ├── types/              # TypeScript types
│   └── utils/              # Helper utilities
├── .dockerignore
├── .env.example
├── Dockerfile
├── index.ts                # Application entry point
├── package.json
├── README.md
└── tsconfig.json
```
---

## Environment Variables

Create a `.env` file from `.env.example`.

```env
PORT=8001

DB_URL=mongodb://localhost:27017
DB_NAME=syncora24

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRESIN=1h

REDIS_HOST=127.0.0.1
REDIS_URL=redis://localhost:6379
```

> Never commit your `.env` file. Only commit `.env.example`.

---

## Getting Started

From the project root:

```bash
docker-compose up --build
```

This starts:

- Redis

From the monorepo root:

```bash
pnpm --filter backend dev
```

Or from the backend directory:

```bash
pnpm install
pnpm dev
```

The application will be available at:

```text
http://localhost:8001
```

---

## Key Features

- JWT-based authentication
- WebRTC signaling with Socket.IO
- Real-time messaging
- Redis-powered room state management
- MongoDB data persistence
- MVC architecture
- Docker support

<!-- ---

## Documentation

Detailed documentation is available in the root `docs/` directory:

- API Reference
- Architecture
- WebSocket Events
- Deployment Guide -->
