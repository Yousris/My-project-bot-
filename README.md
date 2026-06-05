# 🤖 SANTAX Bot - Advanced WhatsApp AI Assistant

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-green.svg" alt="Node.js Version">
  <img src="https://img.shields.io/badge/Library-Baileys-blue.svg" alt="Baileys Library">
  <img src="https://img.shields.io/badge/Platform-AWS%20EC2-orange.svg" alt="AWS EC2">
  <img src="https://img.shields.io/badge/Database-Redis%20%26%20Docker-blue" alt="Database">
</p>

**SANTAX Bot** is a high-performance, modular WhatsApp automation framework built with **Node.js** and the **Baileys** library. Engineered for scalability, the system is fully deployed on cloud infrastructure using **AWS EC2**, leveraging **Docker** and **Redis** for state caching and optimized data management. 

This project is built with a clean architecture, decoupling sensitive credentials from source code while embedding robust Large Language Model (LLM) integrations for intelligent real-time conversational processing.

---

## 🚀 Key Features

- 🧠 **LLM Orchestration:** Seamlessly integrated with high-speed AI inference (Groq API) to deliver fast, context-aware responses.
- ⚡ **Production-Ready Hosting:** Scaled and hosted on an **AWS EC2** instance running Amazon Linux for high network availability.
- 🗄️ **Optimized State Management:** Implements **Redis** running inside **Docker** containers to handle swift session tracking and database operations.
- 🛠️ **Modular Plugin Architecture:** Features a clean, highly extensible codebase allowing new features and commands to be modularly hot-loaded.
- 🔒 **Secured Enterprise Setup:** Hardened local session storage (`.gitignore` enforced) to prevent runtime credential leaks on public tracking trees.

---

## 🛠️ Prerequisites

Ensure the following environments are configured on your host server or local workspace before launching:
- **Node.js** (v18.0.0 or higher)
- **NPM** (Node Package Manager)
- **Docker & Redis** (For active caching pipelines)

---

## 💻 Installation & Deployment
1 .npm install
2.​Create a .env file in your root folder and supply your private credential endpoints
GROQ_API_KEY=your_groq_api_key_here
SESSION_ID=santax_session
3.npm start
*project structure*
├── auth_info/          # Secure, locally cached connection states (Ignored in VCS)
├── commands.js         # Core command routing engine
├── config.js           # Global system and module configurations
├── database.js         # Database connections and Redis client interfaces
├── helpers.js          # Utility libraries and cross-functional helpers
├── main.js             # Primary application entry point
├── package.json        # Manifest file managing project dependencies
└── .gitignore          # Security rules preventing upstream leaks of private variables

👤 Lead Developer
​SANTQX (SANTAX)
​GitHub: @Yousris
​Instagram: @ste_lth_1
​Disclaimer: This repository serves as an entry to enterprise-level software infrastructure design, integrating intelligent web services within everyday communications.
### 1. Clone the Repository
```bash
git clone git@github.com:Yousris/My-project-bot-.git
cd My-project-bot-
