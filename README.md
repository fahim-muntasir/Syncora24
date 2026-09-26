# Syncora24 — Full-Stack Real-Time Language Practice Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-98%25-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://syncora24-frontend.vercel.app)

> **Practice Speaking With Real People.**
>
> A full-stack real-time language practice platform where people can join interactive rooms, communicate through live audio and video, share their screens, and practice speaking with others in real time.

**Live Demo:** https://syncora24-frontend.vercel.app

---

## Live Services

| Service | URL |
|---|---|
| Frontend | https://syncora24-frontend.vercel.app |
| Backend API | https://syncora24.onrender.com/api/health |

---

## About

Syncora24 is a full-stack real-time language practice platform designed around live communication rather than traditional asynchronous learning.

Users can join practice rooms and interact with other participants through:

- Real-time text chat
- Live audio conversations
- Live video conversations
- Screen sharing
- Real-time speaking indicators
- Participant microphone and camera controls
- Host and moderator controls
- Live room activity visibility

The platform is built as a Turborepo monorepo with separate Next.js and Express.js applications. Socket.IO handles real-time application events and WebRTC signaling, while WebRTC establishes peer-to-peer media connections between participants.

MongoDB stores persistent application data, while Redis manages temporary room state and moderation state that needs to be synchronized across connected clients.

The project focuses on building a production-oriented real-time communication system with authentication, room lifecycle management, moderation, synchronized state, and peer-to-peer media communication.

---

## Project History

Syncora24 is an evolution of my earlier **QuizVerse** frontend and backend projects.

The original project included quiz functionality alongside real-time rooms. I later refactored the codebase into a Turborepo monorepo, removed the quiz functionality, redesigned the architecture, and rebuilt the application around real-time language practice.

The project has since evolved from a voice-and-chat prototype into a more complete real-time communication platform with audio/video conversations, screen sharing, room moderation, and live room activity.

### Previous Repositories

- QuizVerse Frontend: https://github.com/fahim-muntasir/quizVerse
- QuizVerse Backend: https://github.com/fahim-muntasir/quizVerse-backend

---

## Screenshots

| Landing Page | Practice Room | Room Details |
|---|---|---|
| ![Landing](./docs/screenshots/ss1.png) | ![Room](./docs/screenshots/ss5.png) | ![Room Details](./docs/screenshots/ss2.png) |

---

## Key Features

### Real-Time Audio & Video Communication

Syncora24 uses WebRTC for peer-to-peer media communication.

- Live voice conversations between room participants
- Live video conversations
- Peer-to-peer media streams
- Socket.IO-based signaling
- Microphone controls
- Camera controls
- Real-time microphone state synchronization
- Real-time speaking indicators
- Participant media status updates

---

### Screen Sharing

Participants can share their screen during a room session.

- Browser-based screen capture using WebRTC
- Real-time screen stream sharing
- Screen-sharing state synchronized with other participants
- Participants can start and stop sharing during an active session
- Screen sharing works alongside the room's audio/video communication

---

### Real-Time Room Chat

Each practice room includes real-time text communication.

- Instant room messaging using Socket.IO
- Messages synchronized across connected participants
- Room-specific conversation
- Chat remains integrated with the live communication experience

---

### Live Room Activity

Room activity is surfaced directly inside the chat experience so participants can understand what is happening in the room without relying only on separate notifications.

Activity events can include:

- Participant joined
- Participant left
- Participant was kicked
- Moderator promotion
- Microphone mute/unmute events
- Mute-all enabled or disabled
- Room ended

Activity events are delivered through Socket.IO and rendered alongside the room's chat experience.

---

### Room Moderation

Syncora24 includes a role-based moderation system for managing live communication rooms.

#### Members

Regular members can:

- Mute themselves
- Unmute themselves when moderation restrictions allow it
- Enable or disable their camera
- Participate in audio/video conversations
- Send messages in the room

#### Hosts & Moderators

Hosts and moderators can:

- Mute individual participants
- Unmute individual participants when permitted
- Manage participant microphone controls
- Apply moderation restrictions
- Manage room participants
- Perform moderation actions from the participant list

#### Global Mute All

Hosts can enable a room-wide mute state.

- All participants can be forced into a muted state
- Participants cannot bypass an active moderation restriction
- Individual forced-mute state is handled separately from global mute-all state
- Moderation state is synchronized in real time
- Moderation state persists when participants leave and rejoin the room

#### Persistent Moderation State

Redis stores temporary moderation state so that participants receive the correct permissions and microphone state when joining or rejoining an active room.

---

### Participant Management

The room provides real-time participant management for hosts and moderators.

- Participant list updates in real time
- Role-aware controls
- Moderator management
- Participant mute controls
- Participant removal/kick actions
- Real-time participant state synchronization

---

### Room Lifecycle Management

Rooms have an explicit lifecycle instead of simply disappearing when a session ends.

- Hosts can end active rooms
- Room status is updated when a host ends a room
- Active participants receive a real-time `room-ended` event
- Participants see a room-ended state instead of being abruptly redirected
- Room listings can update when a room ends
- Redis maintains temporary room lifecycle state

---

### Secure Authentication

Syncora24 uses JWT-based authentication.

- Access tokens
- Refresh tokens
- Protected routes
- Authenticated room access
- Token refresh handling
- Role-aware access to room actions

---

### Redis-Based Real-Time State

Redis is used for temporary state that needs fast access and synchronization.

Room state can include:

- Active room information
- Room participants
- Participant membership
- Individual forced-mute state
- Global mute-all state
- Room lifecycle status
- Moderation-related state

Redis also helps coordinate concurrent room operations and maintain consistent state across real-time interactions.

---

### Monorepo Architecture

The project is organized as a Turborepo monorepo using pnpm workspaces.

- Separate frontend and backend applications
- Shared workspace configuration
- Centralized development scripts
- Independent application development and deployment
- Clear separation between client and server responsibilities

---

### Containerized Development

Docker Compose is used for local infrastructure.

Currently, Docker Compose provides the Redis service required for local real-time room state management.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Redux Toolkit, RTK Query, Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Architecture | MVC |
| Real-Time | Socket.IO |
| Media Communication | WebRTC |
| Database | MongoDB, Mongoose |
| Cache / Room State | Redis |
| Authentication | JWT |
| Monorepo | Turborepo, pnpm workspaces |
| Containerization | Docker, Docker Compose |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Database Hosting | MongoDB Atlas |
| Redis Hosting | Redis Cloud |

---

## Architecture

```text
                         +-------------------------+
                         |     Next.js Frontend    |
                         |-------------------------|
                         | App Router              |
                         | Redux Toolkit / RTK     |
                         | Socket.IO Client        |
                         | WebRTC                  |
                         +-----------+-------------+
                                     |
                    +----------------+----------------+
                    |                                 |
                 REST API                         Socket.IO
                    |                         Real-Time Events
                    |                                 |
                    v                                 v
          +------------------------------------------------+
          |              Express.js Backend                |
          |------------------------------------------------|
          | REST API                                       |
          | Authentication                                 |
          | Room Management                                |
          | Socket.IO Server                              |
          | WebRTC Signaling                               |
          | Moderation & Room State Coordination           |
          +-------------------+----------------------------+
                              |
                 +------------+-------------+
                 |                          |
                 v                          v
        +----------------+         +----------------+
        |    MongoDB     |         |     Redis      |
        |----------------|         |----------------|
        | Users          |         | Room State     |
        | Rooms          |         | Participants   |
        | Persistent     |         | Moderation     |
        | Application    |         | Lifecycle      |
        | Data           |         | Temporary Data |
        +----------------+         +----------------+

                    WebRTC Media Connections

          Client A  <======================>  Client B
                     Audio / Video / Screen

                     Socket.IO Signaling
                              |
                              v
                    Express.js Socket Server
```

### Communication Flow

**REST API**

The frontend uses REST APIs for operations such as:

- Authentication
- User-related operations
- Room data
- Persistent application data

**Socket.IO**

Socket.IO handles real-time application events such as:

- Room membership updates
- Chat messages
- Participant state changes
- Moderation events
- Room activity events
- Room lifecycle events
- WebRTC signaling

**WebRTC**

WebRTC establishes peer-to-peer media connections for:

- Audio
- Video
- Screen sharing

Socket.IO is used for signaling before the WebRTC peer connection is established.

**MongoDB**

MongoDB stores persistent application data.

**Redis**

Redis manages low-latency temporary room state and moderation state that must be available to active participants.

---

## Project Structure

```text
syncora24/
├── apps/
│   ├── frontend/              # Next.js App Router application
│   └── backend/               # Express.js REST API & Socket.IO server
│
├── packages/                  # Shared packages and configurations
│
├── docs/                      # Project documentation and screenshots
│
├── docker-compose.yaml        # Local infrastructure configuration
├── turbo.json                 # Turborepo pipeline configuration
├── pnpm-workspace.yaml        # pnpm workspace configuration
├── package.json               # Root workspace scripts
├── .gitignore
└── README.md
```

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Redis | Redis Cloud |

The frontend and backend are deployed independently while MongoDB Atlas and Redis Cloud provide the production data and real-time state infrastructure.

---

## Getting Started

### Prerequisites

Before running the project locally, make sure you have:

- Node.js **20+**
- pnpm
- Docker
- Docker Compose

Install pnpm if necessary:

```bash
npm install -g pnpm
```

---

### Installation

Clone the repository:

```bash
git clone https://github.com/fahim-muntasir/Syncora24.git
```

Navigate to the project:

```bash
cd Syncora24
```

Install workspace dependencies:

```bash
pnpm install
```

Create the environment files:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Configure the required environment variables before starting the applications.

---

### Start Local Infrastructure

Start the Docker services:

```bash
docker-compose up --build
```

The current Docker Compose setup provides:

- Redis

---

### Start the Monorepo

Run the applications from the project root:

```bash
pnpm dev
```

Or start the applications independently:

```bash
pnpm --filter frontend dev
pnpm --filter backend dev
```

The applications will be available at:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8001
```

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all workspace applications in development mode |
| `pnpm build` | Build all workspaces |
| `pnpm lint` | Run ESLint across all workspaces |
| `pnpm format` | Format source code when configured |

---

## Documentation

More application-specific documentation is available inside each application:

- [Frontend Documentation](apps/frontend/README.md)
- [Backend Documentation](apps/backend/README.md)

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