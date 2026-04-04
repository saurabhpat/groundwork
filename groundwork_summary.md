# Groundwork: Visual System Summary (1-Pager)

Groundwork is a professional conversation-coaching platform designed to help users practice high-stakes professional interactions through AI-driven simulations.

## 1. Application Phases & Visual Flow

### Phase 1: Analytical Profile & History
The initial landing experience provides a high-level overview of past performance and entry into the simulation engine.
![Analytical Profile Interface](file:///C:/Users/patil/.gemini/antigravity/brain/db08ab87-1c88-45d9-9c44-870d35c59490/profile_png_1775285201276.png)

### Phase 2: Career Context Onboarding
A structured 5-step interactive interview gathers critical context about the user's specific scenario, goals, and communication blockers.
![Interactive Onboarding](file:///C:/Users/patil/.gemini/antigravity/brain/db08ab87-1c88-45d9-9c44-870d35c59490/onboarding_png_1775285214094.png)

### Phase 3: Personalized Coaching Brief
Before entering the simulation, users receive a synthesized coaching brief and calibrate the "intensity" levels for the practice.
![Dynamic Calibration & Brief](file:///C:/Users/patil/.gemini/antigravity/brain/db08ab87-1c88-45d9-9c44-870d35c59490/coaching_png_1775285331045.png)

### Phase 4: Live AI Simulation
The core interaction phase provides a rich, multi-modal simulation with real-time health tracking and phase-specific coaching guidance.
![Simulation Engine](file:///C:/Users/patil/.gemini/antigravity/brain/db08ab87-1c88-45d9-9c44-870d35c59490/simulation_png_1775285435024.png)

### Phase 5: Analytical Feedback Report
A deep-dive analysis into the session performance, highlighting rhetorical markers and providing stronger phrasing alternatives.
![Analytical Performance Report](file:///C:/Users/patil/.gemini/antigravity/brain/db08ab87-1c88-45d9-9c44-870d35c59490/feedback_png_1775285475623.png)

## 2. Internal Architecture
- **Frontend:** React 18 SPA built with Vite.
- **State Management:** Centralized in `App.jsx`, utilizing local storage for session persistence and API keys.
- **Logic Decoupling:** Core functionalities are isolated into custom React hooks (`useOnboardingChat.js`, `useConversation.js`).
- **AI Client:** A robust, unified client (`aiClient.js`) that handles Groq API communication, transcription, and JSON cleaning.

## 3. Tech Stack & Models
- **Provider:** Groq API
- **LLM:** `llama-3.3-70b-versatile`
- **STT:** `whisper-large-v3-turbo` (Groq Whisper)
- **Styling:** Vanilla CSS with custom premium tokens.

## 4. Guardrails & Safety
- **Session Health:** Numeric 0-100 score tracking conversation quality.
- **Trigger Pauses:** Automatic simulation suspension for sensitive topics or extreme stress signals.
- **Input Filtering:** Hardcoded checks for distress, profanity, and legal/medical topics.
