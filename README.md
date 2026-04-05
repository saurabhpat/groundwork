# Groundwork: AI-Driven Professional Conversation Coaching

**Talk to AI before talking to the real person.** 
Groundwork is a safe space to simulate high-stakes career conversations—from salary negotiations to difficult feedback. Master your delivery in private, then walk into the real room with calm confidence.

![Deploy to GitHub Pages](https://github.com/saurabhpat/groundwork/actions/workflows/deploy.yml/badge.svg)
![React](https://img.shields.io/badge/Powered%20By-React%2018-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Built%20With-Vite-646CFF?logo=vite)
![Groq](https://img.shields.io/badge/AI-Groq%20Cloud-orange)

---

## 🚀 Overview

Groundwork transforms the coaching experience by moving beyond static advice. It uses state-of-the-art LLMs and Speech-to-Text models to create dynamic, responsive counterparties that react to your tone, strategy, and phrasing in real-time.


---

## 🛠 Tech Stack

- **Frontend Framework:** React 18 SPA built with Vite for optimal performance.
- **Styling Architecture:** Vanilla CSS design system utilizing custom premium tokens for a professional look.
- **AI Infrastructure:** Groq Cloud for ultra-low latency inference.
- **Models:**
    - **LLM:** `llama-3.3-70b-versatile` (Llama 3.3).
    - **STT:** `whisper-large-v3-turbo` (Groq Whisper).

---

## 🧠 Technical Deep Dive

For an in-depth look at our prompt engineering, system architecture, and safety guardrails, please see the [Groundwork Architecture 1-Pager](groundwork_architecture_1pager.md).

---

## 💻 Local Installation & Setup

Follow these steps to get Groundwork running on your machine:

### 1. Prerequisites
- **Node.js:** Ensure you have Node.js installed (v18.0.0 or higher recommended). [Download Node.js](https://nodejs.org/).
- **Groq API Key:** You will need a Groq API key to power the simulations. You can get one for free at the [Groq Console](https://console.groq.com/).

### 2. Clone the Repository
```bash
git clone https://github.com/saurabhpat/groundwork.git
cd groundwork
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Groundwork requires an API key to communicate with the Groq models.

1. Locate the `.env.example` file in the root directory.
2. Create a new file named `.env.local` by copying the example:
   ```bash
   cp .env.example .env.local
   ```
3. Open `.env.local` and add your Groq API key:
   ```env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

> [!TIP]
> Groundwork also supports setting the API key directly within the application's settings UI, which persists to your browser's local storage.

---

## 🏃 Running the Application

### Development Mode
Start the local development server:
```bash
npm run dev
```
Once started, open your browser and navigate to the URL provided in the terminal (usually `http://localhost:5173`).

### Building for Production
To create an optimized production build:
```bash
npm run build
```
The output will be generated in the `dist` folder.

---

## 🛡 Guardrails & Safety

Groundwork includes a multi-layered safety and operational system:
- **Session Health monitoring:** Real-time checking for distress signals and conversation quality.
- **Trigger Pauses:** Detects extreme stress signals or sensitive topics (e.g., legal issues) and pauses the simulation.
- **Input Filtering:** Hardcoded protection against profanity and non-professional discourse.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue for any bugs or feature requests.

## 📄 License

This project is private and intended for educational/personal use within the Groundwork program.

---
*Built with ❤️ for professional growth.*