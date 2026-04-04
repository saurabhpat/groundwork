# Groundwork: AI-Driven Professional Conversation Coaching
## System Architecture & Strategic Overview (1-Pager)

Groundwork is a professional simulation platform designed to help users master high-stakes communications—from salary negotiations to delivering difficult feedback—through high-fidelity AI-driven scenarios.

---

## 1. Application Stages

### Stage 0: Proposition Landing Page
![Proposition Landing Page](file:///C:/Users/patil/.gemini/antigravity/brain/173afa8c-2de5-4687-9f93-d20c1e8c4041/landing_page_screen_1775333175176.png)
The proposition-led entry point identifies the core mission: "Talk to AI before talking to the real person." It utilizes high-impact typography and an animated conversational preview to immediately demonstrate the value of safe, private practice.

### Stage 1: Analytical Profile & History
![Analytical Profile](file:///C:/Users/patil/.gemini/antigravity/brain/db08ab87-1c88-45d9-9c44-870d35c59490/profile_png_1775285201276.png)
The analytical dashboard provides a high-level overview of past performance and entry into the simulation engine. Users can review their historical performance trends and session summaries before starting a new practice session.

### Stage 2: Career Context Onboarding
![Career Onboarding](file:///C:/Users/patil/.gemini/antigravity/brain/db08ab87-1c88-45d9-9c44-870d35c59490/onboarding_png_1775285214094.png)
A structured 6-step interactive interview gathers critical context about the user's specific scenario, goals, and communication blockers. This stage ensures the AI has a granular understanding of the user's professional situation.

### Stage 3: Personalized Coaching Brief
![Coaching Brief](file:///C:/Users/patil/.gemini/antigravity/brain/db08ab87-1c88-45d9-9c44-870d35c59490/coaching_png_1775285331045.png)
Before entering the simulation, users receive a synthesized coaching brief and calibrate the "intensity" levels for the practice. This includes adjusting power dynamics and the counterpart's initial disposition.

### Stage 4: Live AI Simulation
![AI Simulation](file:///C:/Users/patil/.gemini/antigravity/brain/db08ab87-1c88-45d9-9c44-870d35c59490/simulation_png_1775285435024.png)
The core interaction phase provides a rich, multi-modal simulation with real-time health tracking and phase-specific coaching guidance. The AI responds authentically to the user's tone and strategy.

### Stage 5: Analytical Feedback Report
![Analytical Report](file:///C:/Users/patil/.gemini/antigravity/brain/db08ab87-1c88-45d9-9c44-870d35c59490/feedback_png_1775285475623.png)
A deep-dive analysis into the session performance, highlighting rhetorical markers and providing stronger phrasing alternatives. This feedback loop is essential for iterative professional improvement.

---

## 2. Technology Stack & AI Models

- **Frontend Framework:** React 18 SPA built with Vite for optimal performance.
- **Styling Architecture:** Vanilla CSS design system utilizing custom premium tokens for a sleek, professional look.
- **AI Infrastructure:** Groq Cloud for ultra-low latency inference.
- **LLM Engine:** `llama-3.3-70b-versatile` (Llama 3.3).
- **Audio Engine (STT):** `whisper-large-v3-turbo` (Groq Whisper).

---

## 3. Technical Architecture

- **State Management:** Centralized in the `App.jsx` root, utilizing React `useState` and `localStorage` for session persistence.
- **Logic Decoupling:** Core engines are isolated into custom hooks (`useOnboardingChat.js`, `useConversation.js`) to keep the UI layer focused.
- **AI Client Layer:** A unified `aiClient.js` module handles all Groq API communication, including automatic JSON cleaning and robust error fallbacks.

---

## 4. System Prompt Framework

Groundwork utilizes three specialized AI engines, each governed by a rigorous system prompt framework.

### A. Synthesis Engine (`useOnboardingChat.js`)
Triggered after the 6-step onboarding, this engine condenses qualitative user data into a structured simulation profile.
- **Role**: Professional Scenario Analyst.
- **Context**: Raw user responses from the onboarding chat (Goals, Blockers, Feelings, Actual Scenario).
- **Task**: Synthesize the user's multi-step input into a unified coaching profile.
- **Format**: Valid JSON matching the application's profile schema.
- **Constraints**: STRICT - No inventing details, map to 1 of 8 predefined archetypes, and provide a 2-3 sentence empathetic summary.

### B. Persona Engine (`personaEngine.js`)
This engine generates a realistic, high-fidelity counterpart for the user to practice against.
- **Role**: Expert Career Coach & Simulation Designer.
- **Context**: The synthesized user profile (Relationship context, fears, experience level).
- **Task**: Select the most appropriate scenario archetype and generate a vivid, reactive counterpart persona.
- **Format**: Raw JSON including role, backstory, personality, and a high-tension opening line.
- **Constraints**: The opening line must drop into the moment immediately without pleasantries. Personality must manifest the user's specific fear.

### C. Simulation Engine (`useConversation.js`)
The core conversational agent that manages the live roleplay and provides real-time coaching.
- **Role**: The specific counterparty persona (e.g., a "Defensive Manager" or "Skeptical Client").
- **Context**: User goal, specific situation, relationship dynamic, and the current practice phase (Calibration).
- **Task**: Reactpure realistically in character while parallel-processing coaching feedback as an "aside".
- **Format**: JSON object containing `reply`, `coaching_aside`, and `health_delta`.
- **Constraints**: No legal/medical advice. Deduct health points for hostility, looping, or extreme stress signals. Set `trigger_pause` for safety issues.

---

## 5. Multi-Layered Guardrails

Groundwork implements a sophisticated safety and operational system defined in `guardrails.js`.

- **Safety Guards:** Real-time checking for distress signals ("I give up", "panicking"), sensitive topics (legal/harassment), and profanity.
- **Session Health Management:** A numeric 0-100 score tracking conversation quality. Health is deducted for user hostility (-20), AI aggression (-25), or user looping (-15).
- **Automatic Suspension:** The system triggers an immediate `pause` if health drops below 50% or if high-risk legal topics (e.g., discrimination, lawsuits) are detected.
- **Operational Limits:** Includes input length validation (min 3 chars) and a session cap of 25 turns to manage API costs and prevent model drift.

---
*Built for professional mastery.*
