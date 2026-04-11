# Agentic AI Mental Health Assistant

A MERN application with an AI-assisted mental health chat experience. The repository is organized as a two-app workspace:

- `client/` contains the React frontend
- `server/` contains the Node/Express backend

## Project Structure

```text
root/
|-- client/
|   |-- public/
|   |-- src/
|   |-- .env
|   |-- .env.example
|   |-- package.json
|   |-- package-lock.json
|   |-- postcss.config.js
|   `-- tailwind.config.js
|-- server/
|   |-- src/
|   |-- .env
|   |-- .env.example
|   `-- package.json
|-- .gitignore
`-- README.md
```

## Tech Stack

### Frontend

- React
- React Router
- Axios
- Tailwind CSS
- Create React App tooling

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- Gemini API

## Installation

### Prerequisites

- Node.js 18+ recommended
- npm
- MongoDB running locally or a MongoDB Atlas connection string
- Gemini API key

### Install frontend dependencies

```bash
cd client
npm install
```

### Install backend dependencies

```bash
cd server
npm install
```

## Environment Variables

### Frontend

Create `client/.env` if needed:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

The example file is available at `client/.env.example`.

### Backend

Create `server/.env` from `server/.env.example` and fill in your values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/mental-health-assistant
JWT_SECRET=your-super-secret-jwt-key-change-in-production
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODEL=gemini-2.5-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
FRONTEND_URL=http://localhost:3000
```

## MongoDB Setup (Required)

The application requires MongoDB. You have two options:

### Option 1: MongoDB Atlas (Recommended - Free & Easy)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a new cluster (free tier available)
4. Click "Connect" -> "Connect your application"
5. Copy the connection string
6. Replace the `MONGODB_URI` in `server/.env` with your connection string
7. Replace `<username>` and `<password>` with your database credentials

### Option 2: Local MongoDB

1. Install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   - Windows: MongoDB runs as a service automatically
   - Mac: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`
3. Use the default local connection string in `server/.env`

## Run Commands

### Frontend

This frontend still uses Create React App scripts, so the development command is:

```bash
cd client
npm install
npm start
```

### Backend

```bash
cd server
npm install
npm run dev
```

## Auth Flow

The active auth flow is now:

1. Open the app at `http://localhost:3000`
2. Sign up on `/signup`
3. After a successful signup, the app redirects back to `/`
4. Log in with either your email or your signup name plus your password
5. Successful login redirects to `/home`
6. Use the `Chat` link in the navbar to open the protected AI chat page

The protected routes are:

- `/home`
- `/chat`

If the JWT token is missing or invalid, the app redirects back to `/`.

## RAG And AI

The chat page now uses the backend pipeline at `POST /api/chat/message`, which activates:

1. Mood detection
2. Safety analysis
3. RAG knowledge retrieval from `server/src/services/rag/knowledge-base.js`
4. Response planning
5. Final response generation with Gemini

The chat UI shows the server outputs during conversation, including:

- detected mood
- safety level
- response plan
- RAG document match count and categories
- follow-up prompt
- helpful resources
- processing time

Gemini is read from `server/.env` via `GEMINI_API_KEY`. The backend uses Google's OpenAI-compatible endpoint and defaults to `gemini-2.5-flash`. If you want to try Pro, set `GEMINI_MODEL=gemini-2.5-pro` and optionally keep `GEMINI_FALLBACK_MODEL=gemini-2.5-flash` so the app can recover from quota limits automatically.

## Build

To create a production frontend build:

```bash
cd client
npm run build
```

## API Overview

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Chat

- `POST /api/chat/message`
- `GET /api/chat/history`
- `GET /api/chat/:chatId`
- `GET /api/chat/mood-history`
- `POST /api/chat/new`

### User

- `GET /api/user/profile`
- `PUT /api/user/profile`
- `PUT /api/user/password`

## AI Pipeline

The backend processes each message through these stages:

1. Mood detection
2. Safety check
3. Knowledge retrieval
4. Response planning
5. Response generation

Primary backend services:

- `server/src/services/ai/mood.service.js`
- `server/src/services/ai/safety.service.js`
- `server/src/services/rag/rag.service.js`
- `server/src/services/ai/planner.service.js`
- `server/src/services/ai/response.service.js`
- `server/src/services/orchestrator.service.js`

## Notes

- The root no longer contains a frontend `package.json`.
- `.gitignore` remains at the repository root.
- `server/` is kept separate and unchanged by the frontend move.

## Troubleshooting

### MongoDB connection errors

Verify MongoDB is running and that `MONGODB_URI` is correct in `server/.env`.

### CORS errors

Confirm `FRONTEND_URL` in `server/.env` matches the URL where the client is running.

### Gemini API errors

Check that `GEMINI_API_KEY` is present and valid in `server/.env`.

## Disclaimer

This project is for educational purposes and is not a replacement for professional mental health care. If someone is in immediate crisis, contact local emergency services or an appropriate crisis hotline.
