# Syncora24 — Backend

Backend API and real-time server for **Syncora24**, built with **Node.js**, **Express.js**, **TypeScript**, **MongoDB**, **Redis**, and **Socket.IO**.

The backend provides REST APIs, authentication, room management, real-time communication, moderation, room state synchronization, and WebRTC signaling.

**API Health Check:** https://syncora24.onrender.com/api/health

---

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB + Mongoose |
| Cache / Room State | Redis |
| Authentication | JWT |
| Real-Time | Socket.IO |
| Media Signaling | WebRTC + Socket.IO |
| Architecture | MVC |
| Validation | Schema-based validation |
| Containerization | Docker |
| Deployment | Render |

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
│   ├── models/             # MongoDB models
│   ├── redis/              # Redis configuration and room state
│   ├── routes/             # REST API routes
│   ├── schemas/            # Validation schemas
│   ├── socket/             # Socket.IO handlers and events
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
DB_URL=
DB_NAME="syncora24"
ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRESIN="1h"
REDIS_HOST=127.0.0.1
REDIS_URL=
REFRESH_TOKEN_SECRET=
METERED_TURN_API_KEY=
```

> Never commit your `.env` file. Only commit `.env.example`.

Use strong, environment-specific secrets for production deployments.

---

## Getting Started

### Start Local Infrastructure

From the project root:

```bash
docker-compose up --build
```

The current Docker Compose configuration starts:

- Redis

---

### Start the Backend

From the monorepo root:

```bash
pnpm --filter backend dev
```

Or from the backend directory:

```bash
cd apps/backend
pnpm install
pnpm dev
```

The backend will be available at:

```text
http://localhost:8001
```

---

## Core Responsibilities

The backend is responsible for:

- Authentication
- User authorization
- Room management
- Participant management
- Room lifecycle management
- Real-time messaging
- Room activity events
- Moderation permissions
- Participant mute state
- Global mute-all state
- Room state synchronization
- WebRTC signaling
- Redis-backed temporary state
- MongoDB persistence

---

## Authentication

Syncora24 uses JWT-based authentication.

The backend supports:

- Access tokens
- Refresh tokens
- Protected API routes
- Authenticated socket interactions
- Permission-aware room actions

Authentication is used to determine whether a user can access protected resources and perform specific room actions.

---

## Real-Time Communication

Socket.IO provides the real-time communication layer.

It is used for:

- Room joining and leaving
- Participant updates
- Chat messages
- Room activity
- Microphone state updates
- Moderation events
- Moderator changes
- Participant removal
- Room lifecycle events
- WebRTC signaling

The backend acts as the real-time coordination layer while WebRTC establishes peer-to-peer media connections between clients.

---

## WebRTC Signaling

The backend does not transport the actual audio, video, or screen-share media streams.

Instead, Socket.IO is used as the signaling mechanism for WebRTC.

The signaling layer coordinates information required for peer connections, such as:

- Session descriptions
- ICE candidates
- Peer connection events
- Media connection state

After signaling is completed, media streams can be exchanged directly between participants through WebRTC.

---

## Audio & Video Communication

The backend supports the real-time coordination required for:

- Voice conversations
- Video conversations
- Participant media state
- Microphone state
- Camera state

Actual audio and video media are handled by WebRTC peer connections on the clients.

---

## Screen Sharing

Screen sharing uses the same real-time communication architecture.

The frontend captures the user's screen and establishes the appropriate WebRTC media stream.

The backend's role is primarily to coordinate the signaling and real-time state required by connected participants.

---

## Room Moderation

Syncora24 includes role-based room moderation.

The backend enforces room permissions rather than relying only on frontend UI controls.

### Member Permissions

Regular members can:

- Manage their own microphone state
- Manage their own camera state
- Participate in room communication
- Send room messages

### Host & Moderator Permissions

Hosts and moderators can perform additional room-management actions, including:

- Managing participant microphone state
- Applying forced mute
- Managing room participants
- Performing moderation actions according to their role
- Receiving synchronized moderation events

---

## Persistent Moderation State

Redis stores moderation-related room state so that moderation rules remain consistent during an active session.

State can include:

- Individual forced-mute state
- Global mute-all state
- Participant membership
- Moderator information
- Room lifecycle state

This allows participants to receive the appropriate state when they join or rejoin a room.

---

## Global Mute All

The backend supports a room-wide mute state controlled by the host.

When mute-all is active:

- Participants receive the appropriate real-time moderation event
- Clients update their microphone state
- Participants cannot bypass the active moderation restriction through the normal client controls
- Individual forced-mute state remains separately identifiable
- The moderation state is persisted in Redis

---

## Participant Management

The backend coordinates participant state in real time.

This includes:

- Joining rooms
- Leaving rooms
- Participant presence
- Participant role information
- Participant removal
- Moderation state
- Real-time participant updates

Room membership operations are coordinated through Redis to maintain consistent active-room state.

---

## Live Room Activity

Important room events are emitted as real-time activity events.

These events allow the frontend to display room activity directly inside the chat interface.

Examples include:

- User joined
- User left
- User was kicked
- Moderator promoted
- Participant muted
- Participant unmuted
- Mute-all enabled
- Mute-all disabled
- Room ended

This separates persistent chat messages from transient room events while allowing both to appear together in the client experience.

---

## Room Lifecycle Management

Rooms have an explicit lifecycle state.

The backend supports:

- Active rooms
- Host-controlled room ending
- Room status updates
- Real-time room-ended events
- Room listing synchronization

When a host ends a room, the backend updates the room state and notifies connected participants through Socket.IO.

The room is not immediately treated as a disconnected client state; instead, the lifecycle event is propagated to all relevant clients so the frontend can present an appropriate room-ended experience.

---

## Redis-Based Room State

Redis is used for fast-changing room state that does not need to be stored as permanent application data.

This includes:

- Active room data
- Participant membership
- Moderator state
- Individual forced-mute state
- Global mute-all state
- Room lifecycle status
- Other temporary room coordination data

MongoDB remains responsible for persistent application data.

---

## Data Responsibilities

```text
MongoDB
│
├── Persistent application data
├── User data
├── Room data
└── Other long-lived records

Redis
│
├── Active room state
├── Participant state
├── Moderation state
├── Room lifecycle state
└── Temporary real-time coordination

Socket.IO
│
├── Real-time events
├── Chat
├── Room activity
├── Moderation events
├── Participant updates
└── WebRTC signaling

WebRTC
│
├── Audio
├── Video
└── Screen sharing
```

---

## Backend Architecture

```text
                         Client
                           |
              +------------+------------+
              |                         |
           REST API                 Socket.IO
              |                         |
              v                         v
       +-------------+          +----------------+
       | Express.js  |          | Socket.IO      |
       | REST Layer  |          | Real-Time      |
       +------+------+          | Server         |
              |                 +-------+--------+
              |                         |
              +------------+------------+
                           |
              +------------+-------------+
              |                          |
              v                          v
       +-------------+            +-------------+
       |   MongoDB   |            |    Redis    |
       | Persistent  |            | Active Room |
       | Application |            | & Moderation|
       |    Data     |            |    State    |
       +-------------+            +-------------+
```

---

## Local Development

For a complete local development environment:

1. Start Redis using Docker Compose.
2. Start the backend development server.
3. Start the frontend development server.
4. Open multiple browser sessions to test real-time communication.
5. Join the same room from different authenticated accounts.

Example:

```bash
# Terminal 1
docker-compose up --build

# Terminal 2
pnpm --filter backend dev

# Terminal 3
pnpm --filter frontend dev
```

---

## Production Deployment

The backend is deployed on **Render**.

Production API health endpoint:

https://syncora24.onrender.com/api/health

Production infrastructure:

| Service | Platform |
|---|---|
| Backend | Render |
| Database | MongoDB Atlas |
| Redis | Redis Cloud |

---

## Related Documentation

- [Root Project Documentation](../../README.md)
- [Frontend Documentation](../frontend/README.md)

---

## License

MIT