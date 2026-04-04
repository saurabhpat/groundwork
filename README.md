# Groundwork: AI-Driven Professional Conversation Coaching

Elevate your professional communication with **Groundwork**, a sophisticated simulation engine designed to help you master high-stakes interactions. Whether you're preparing for a difficult performance review, a salary negotiation, or a complex client pitch, Groundwork provides a safe, intelligent environment to practice, fail, and improve.

![Groundwork Simulation](https://img.shields.io/badge/Status-Beta-blue)
![React](https://img.shields.io/badge/Powered%20By-React%2018-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Built%20With-Vite-646CFF?logo=vite)
![Groq](https://img.shields.io/badge/AI-Groq%20Cloud-orange)

---

## 🚀 Overview

Groundwork transforms the coaching experience by moving beyond static advice. It uses state-of-the-art LLMs and Speech-to-Text models to create dynamic, responsive counterparties that react to your tone, strategy, and phrasing in real-time.

### 🌟 Key Features
- **Analytical Career Onboarding:** A 5-step interactive process to define your specific professional context.
- **Dynamic Simulation Engine:** Powered by `llama-3.3-70b-versatile`, providing high-fidelity conversational logic.
- **Voice-First Interaction:** Integrated STT using Groq's high-speed `whisper-large-v3-turbo`.
- **Real-time Performance Health:** Track session health and stress signals as you speak.
- **Deep Analytics:** Receive a comprehensive feedback report with rhetorical markers and alternative phrasing recommendations.

---

## 🛠 Tech Stack

- **Frontend:** [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **AI Infrastructure:** [Groq Cloud](https://groq.com/) (LLM: Llama 3.3, STT: Whisper Large v3 Turbo)
- **Styling:** Custom Vanilla CSS Design System
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 💻 Local Installation & Setup

Follow these steps to get Groundwork running on your machine:

### 1. Prerequisites
- **Node.js:** Ensure you have Node.js installed (v18.0.0 or higher recommended). [Download Node.js](https://nodejs.org/).
- **Groq API Key:** You will need a Groq API key to power the simulations. You can get one for free (within rate limits) at the [Groq Console](https://console.groq.com/).

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

Groundwork includes built-in safety mechanisms to ensure a professional and constructive experience:
- **Session Health Monitoring:** Automatically identifies when a conversation is derailing.
- **Trigger Pauses:** Detects extreme stress signals or sensitive topics and pauses the simulation.
- **Input Filtering:** Hardcoded protection against profanity and non-professional discourse.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue for any bugs or feature requests.

## 📄 License

This project is private and intended for educational/personal use within the Groundwork program.

---
*Built with ❤️ for professional growth.*