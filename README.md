# StoryAI

StoryAI is a bilingual storytelling platform designed for children and early language learners. The application accepts prompt words via text or voice input, constructs emotionally engaging narratives using Groq LLM inference, and presents the resulting story side-by-side in English and Hindi. Integrated speech synthesis enables children to listen to natural narrations in either language, reinforcing vocabulary acquisition, comprehension, and real-life emotional skills.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Directory Layout](#directory-layout)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Testing and Quality Assurance](#testing-and-quality-assurance)
- [Deployment Options](#deployment-options)
- [License](#license)

---

## Overview

StoryAI combines generative language models with assistive speech technology to deliver accessible reading experiences. When given a set of simple prompt words, the system constructs a cohesive narrative centered around relatable life skills (such as problem solving, regulating emotions, asking for help, or taking turns).

Each story includes:
1. A creative title and thematic classification.
2. An English narrative composed of sensory, accessible sentences.
3. A conversational Hindi translation tailored for young comprehension.
4. An interactive reflection question connecting the theme to the child's daily life.
5. Neural text-to-speech audio with seamless browser synthesis fallback.

---

## Key Features

- **Bilingual Story Generation**: Real-time generation of matched English and Hindi narrative texts based on one to three word prompts.
- **Life Skill Integration**: Stories organically teach practical skills such as emotional regulation, safety awareness, communication, and cooperation.
- **Multimodal Input**: Supports both standard keyboard input and browser SpeechRecognition voice entry.
- **Dual-Layer Audio Narration**: Primary audio generated via Microsoft Edge neural voices (`en-US-AriaNeural`, `hi-IN-MadhurNeural`) with zero-latency client-side Web Speech API fallback.
- **Flexible Reading Layouts**: Configurable reading modes: side-by-side comparison, English-only, or Hindi-only reading views.
- **Local Persistence & History Drawer**: Stores generated stories in browser local storage and supports persistent backend storage via MongoDB.
- **Resilient Fallback Mode**: Built-in deterministic story engine generates full bilingual narratives even when third-party AI APIs or databases are temporarily unreachable.

---

## Technology Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 8
- **Styling**: Vanilla CSS adhering to a strict 4px design scale and editorial typography
- **HTTP Client**: Axios
- **Web APIs**: Web Speech API (`SpeechRecognition`, `SpeechSynthesis`), HTMLAudioElement, Blob API

### Backend & Serverless
- **Runtime**: Node.js (v18.0.0 or higher)
- **Web Framework**: Express 5 / Express 4
- **AI Inference**: Groq SDK (`llama-3.3-70b-versatile`)
- **Speech Synthesis**: `msedge-tts` (Microsoft Edge neural TTS stream)
- **Database (Optional)**: MongoDB via Mongoose
- **Deployment Handlers**: Vercel Serverless Functions, Render Web Service, Cloudflare Pages

---

## System Architecture

```
+-------------------------------------------------------------------+
|                        Client Application                         |
|  - React 19 + Vite Frontend                                       |
|  - SpeechRecognition (Voice Input) & SpeechSynthesis (Audio Play) |
|  - Local Storage Story Library                                    |
+---------------------------------+---------------------------------+
                                  |
               HTTP REST Requests | (JSON / Audio Blob)
                                  v
+-------------------------------------------------------------------+
|                     Backend Server / API Gateway                  |
|  - Express Server / Vercel Serverless Functions                   |
|  - Health Monitoring & Input Sanitization                         |
+-----------------+-------------------------------+-----------------+
                  |                               |
                  v                               v
    +---------------------------+   +---------------------------+
    |   Groq LLM Inference      |   |   Edge Speech Synthesis   |
    |  - llama-3.3-70b          |   |  - en-US-AriaNeural       |
    |  - Structured Story Prompts|  |  - hi-IN-MadhurNeural     |
    |  - Local Fallback Engine  |   |  - Temp File Stream & Purge|
    +-------------+-------------+   +---------------------------+
                  |
                  v (Optional)
    +---------------------------+
    |      MongoDB Atlas        |
    |  - Story Persistence      |
    |  - In-Memory Fallback     |
    +---------------------------+
```

---

## Directory Layout

```
StoryAi/
├── api/                         # Vercel serverless function entrypoints
│   ├── health.js                # Health check endpoint
│   ├── story/
│   │   └── generate.js          # Serverless story generation handler
│   └── tts/
│       └── speak.js             # Audio fallback negotiation handler
├── backend/                     # Dedicated Express backend service
│   ├── models/
│   │   └── Story.js             # Mongoose schema and fallback memory store
│   ├── routes/
│   │   ├── stories.js           # Story history retrieval and deletion
│   │   ├── story.js             # Groq prompting, parsing, and fallback engine
│   │   └── tts.js               # Neural audio streaming and file cleanup
│   ├── temp/                    # Temporary audio storage directory
│   ├── test/
│   │   └── backend.test.js      # Automated unit and integration test suite
│   ├── utils/
│   │   └── ttsService.js        # Edge TTS wrapper and garbage collection
│   ├── package.json             # Backend dependencies and scripts
│   └── server.js                # Standalone backend server entrypoint
├── frontend/                    # React single-page application
│   ├── public/                  # Static assets and redirect rules
│   ├── src/
│   │   ├── components/
│   │   │   ├── StoryDisplay.jsx # Bilingual reader and audio player component
│   │   │   └── WordInput.jsx    # Prompt input, voice capture, and suggestions
│   │   ├── hooks/
│   │   │   ├── useTTS.js        # Audio synthesis and browser speech fallback hook
│   │   │   └── useVoiceInput.js # Microphone speech recognition hook
│   │   ├── api.js               # Centralized Axios client interface
│   │   ├── App.css              # Design system and layout stylesheet
│   │   ├── App.jsx              # Application state and root shell
│   │   ├── index.css            # Global typography and base CSS rules
│   │   └── main.jsx             # React DOM entrypoint
│   ├── package.json             # Frontend dependencies and scripts
│   └── vite.config.js           # Vite development and production configuration
├── scripts/
│   ├── health-check.js          # Pre-deployment environment verification
│   └── start-server.js          # Combined production orchestrator
├── package.json                 # Root dependencies and mono-repo scripts
├── render.yaml                  # Render.io blueprint deployment configuration
├── server.js                    # Unified production server (API + Static SPA)
├── vercel.json                  # Vercel routing and build configuration
└── wrangler.toml                # Cloudflare Pages / Workers deployment manifest
```

---

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **Groq API Key (Optional)**: Required for live LLM generation; the built-in deterministic generator activates automatically if omitted.
- **MongoDB URI (Optional)**: Required for remote database persistence; in-memory storage activates automatically if omitted.

---

## Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Mrvikas06/StoryAi.git
   cd StoryAi
   ```

2. **Install root and service dependencies**:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Verify the environment**:
   ```bash
   npm run health-check
   ```

---

## Configuration

Copy `.env.example` to create your local environment file:

```bash
cp .env.example .env
```

| Environment Variable | Description | Required | Default |
|:---------------------|:------------|:---------|:--------|
| `PORT` | HTTP port for the Express server | No | `4000` |
| `NODE_ENV` | Runtime mode (`development` or `production`) | No | `development` |
| `GROQ_API_KEY` | API key from Groq Console | No | Built-in fallback |
| `MONGODB_URI` | Connection URI for MongoDB Atlas | No | In-memory cache |
| `ALLOWED_ORIGINS` | Comma-delimited list of custom CORS origins | No | `localhost:3000, 5173` |
| `RENDER_EXTERNAL_URL`| Deployed Render service hostname | No | `http://localhost:3000` |
| `VITE_API_BASE_URL` | Base API URL consumed by the frontend | No | `/api` |

---

## Running the Application

### Development Mode (Concurrent Services)

Start the backend API server on port 4000:
```bash
npm run dev:backend
```

In a separate terminal, launch the Vite frontend server on port 5173:
```bash
npm run dev:frontend
```

Open your browser at `http://localhost:5173`.

### Unified Production Mode

Build the frontend bundle and serve both the API and client from a single Node.js process:
```bash
npm run build
npm start
```

Access the unified service at `http://localhost:4000`.

---

## API Reference

### 1. Health Status
- **Method**: `GET`
- **Endpoint**: `/api/health`
- **Response**:
  ```json
  {
    "status": "ok",
    "message": "Server is running",
    "timestamp": "2026-11-13T17:45:00.000Z"
  }
  ```

### 2. Generate Story
- **Method**: `POST`
- **Endpoint**: `/api/story/generate`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "words": ["dragon", "lantern", "friendship"],
    "childId": "guest"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "story": {
      "_id": "story_1731519900_abcde",
      "title": "Dragon and the Gentle Adventure",
      "emoji": "🌟",
      "skillType": "Emotions & Feelings",
      "skill": "Calming Down and Taking Deep Breaths",
      "english": "One bright morning, Leo packed his bag with a dragon and stepped outside...",
      "hindi": "एक सुनहरी सुबह, लियो ने अपना बैग तैयार किया और बाहर की ओर कदम बढ़ाया...",
      "question": {
        "en": "When was a time you took a deep breath to feel calm and brave?",
        "hi": "आपने पिछली बार शांत और मजबूत महसूस करने के लिए गहरी सांस कब ली थी?"
      },
      "words": ["dragon", "lantern", "friendship"],
      "childId": "guest",
      "createdAt": "2026-11-13T17:45:00.000Z"
    }
  }
  ```

### 3. Synthesize Speech
- **Method**: `POST`
- **Endpoint**: `/api/tts/speak`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "text": "Hello little explorer",
    "lang": "en"
  }
  ```
- **Response**: Streamed binary `audio/mpeg` payload.

### 4. Fetch Saved Stories
- **Method**: `GET`
- **Endpoint**: `/api/stories/:childId`
- **Response**: Array of persisted story objects.

### 5. Delete Story
- **Method**: `DELETE`
- **Endpoint**: `/api/stories/:id`
- **Response**:
  ```json
  {
    "success": true
  }
  ```

---

## Testing and Quality Assurance

Run the automated test suite across prompt generation, story parsing, fallback behavior, audio sanitization, and HTTP routes:

```bash
npm test
```

### Verified Test Suite Results:
- Prompt builder validation with multi-word inputs
- Structured plain-text parsing into English, Hindi, and question fields
- Fallback narrative generation under missing API credentials
- Emoji stripping for audio streaming compatibility
- Temporary file management and cleanup
- Route responses for health checks and story generation

---

## Deployment Options

### Option 1: Render.io Web Service
The repository contains a pre-configured `render.yaml` specification for single-process hosting.
1. Connect the GitHub repository in the Render dashboard.
2. Select **Web Service** and choose the `render.yaml` blueprint or set:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
3. Add the optional environment variables (`GROQ_API_KEY`, `MONGODB_URI`).

### Option 2: Vercel (Frontend & Serverless Functions)
The repository contains `vercel.json` configured for zero-configuration deployment.
1. Import the repository into Vercel.
2. Build command: `npm install --prefix frontend && npm run build --prefix frontend`.
3. Output directory: `frontend/dist`.
4. Serverless endpoints are automatically routed from the `/api` directory.

### Option 3: Cloudflare Pages
1. In Cloudflare Pages, connect the repository.
2. Build command: `cd frontend && npm install && npm run build`.
3. Build output directory: `frontend/dist`.
4. Set `VITE_API_BASE_URL` to point to your deployed backend API URL.

---

## Screenshots

### Application Interface Layout

```
+-------------------------------------------------------------------------------+
|  StoryAI  [Bilingual Reader]                           [Saved Stories (3)]    |
+-------------------------------------------------------------------------------+
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  | Story Prompt Words                                                      |  |
|  | Enter up to three words or speak into your microphone.  [Voice Input]   |  |
|  |                                                                         |  |
|  | [ Word 1: Dragon     ]  [ Word 2: Compass    ]  [ Word 3: Mountain   ]  |  |
|  |                                                                         |  |
|  | Try ideas: [Dragon · Compass · Mountain] [Garden · River · Friendship]  |  |
|  |                                                                         |  |
|  |                                                     [Generate Story]    |  |
|  +-------------------------------------------------------------------------+  |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  | [Emotions & Feelings] [Calming Down] [Dragon · Compass · Mountain]      |  |
|  | Dragon and the Gentle Adventure                                         |  |
|  | View: [Side by Side] [English] [Hindi]                     [New Story]  |  |
|  |-------------------------------------------------------------------------|  |
|  | English                        [Read Aloud] | Hindi           [Listen]  |  |
|  |                                             |                           |  |
|  | One bright morning, Leo packed his bag with | एक सुनहरी सुबह, लियो ने    |  |
|  | a dragon and stepped outside. The gentle    | अपना बैग तैयार किया और    |  |
|  | breeze rustled through the tall green trees.| बाहर की ओर कदम बढ़ाया।    |  |
|  |-------------------------------------------------------------------------|  |
|  | REFLECTION QUESTION                                                     |  |
|  | When was a time you took a deep breath to feel calm and brave?           |  |
|  | आपने पिछली बार शांत और मजबूत महसूस करने के लिए गहरी सांस कब ली थी?       |  |
|  +-------------------------------------------------------------------------+  |
|                                                                               |
+-------------------------------------------------------------------------------+
|  StoryAI — Bilingual storytelling and audio narration for young readers.     |
+-------------------------------------------------------------------------------+
```

---

## License

This project is licensed under the MIT License.
