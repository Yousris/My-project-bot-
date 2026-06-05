// config.js
import dotenv from "dotenv";
dotenv.config();

export const MONGODB_URI = process.env.MONGODB_URI;
export const SECRET_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
export const FOUNDER_NUMBER = process.env.FOUNDER_NUMBER || "212644605205";
export const FOUNDER_JID = `${FOUNDER_NUMBER}@s.whatsapp.net`;

const getKeys = (envVar) => (process.env[envVar] || "").split(",").map(k => k.trim()).filter(k => k);

export const API_KEYS = {
    nvidia: getKeys("NVIDIA_KEYS"),
    groq: getKeys("GROQ_KEYS"),
    openrouter: getKeys("OPENROUTER_KEYS"),
    gemini: getKeys("GEMINI_KEYS"),
    openai: getKeys("OPENAI_KEYS")
};

if (process.env.NVIDIA_KEY && !API_KEYS.nvidia.includes(process.env.NVIDIA_KEY)) API_KEYS.nvidia.push(process.env.NVIDIA_KEY);
if (process.env.OPENROUTER_KEY && !API_KEYS.openrouter.includes(process.env.OPENROUTER_KEY)) API_KEYS.openrouter.push(process.env.OPENROUTER_KEY);
if (process.env.OPENAI_KEY && !API_KEYS.openai.includes(process.env.OPENAI_KEY)) API_KEYS.openai.push(process.env.OPENAI_KEY);
if (process.env.GEMINI_KEY && !API_KEYS.gemini.includes(process.env.GEMINI_KEY)) API_KEYS.gemini.push(process.env.GEMINI_KEY);

export const ALLOWED_GROUPS_NAMES = getKeys("ALLOWED_GROUPS");
const BOT_ADMIN_NUMBERS = getKeys("BOT_ADMINS");
export const BOT_ADMIN_JIDS = BOT_ADMIN_NUMBERS.map(num => `${num.replace(/\D/g, "")}@s.whatsapp.net`);

export const AI_MODELS = {
    "kimi2.6": { name: "nvidia_kimi_k2.6", endpoint: "https://integrate.api.nvidia.com/v1/chat/completions", model: "moonshotai/kimi-k2.6", keys: API_KEYS.nvidia },
    "kimi2.5": { name: "nvidia_kimi_k2.5", endpoint: "https://integrate.api.nvidia.com/v1/chat/completions", model: "moonshotai/kimi-k2.5", keys: API_KEYS.nvidia },
    "llama3.3": { name: "nvidia_llama3.3", endpoint: "https://integrate.api.nvidia.com/v1/chat/completions", model: "meta/llama-3.3-70b-instruct", keys: API_KEYS.nvidia },
    "groq": { name: "groq", endpoint: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.1-8b-instant", keys: API_KEYS.groq },
    "gemini": { name: "gemini", endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", model: "gemini-1.5-flash", keys: API_KEYS.gemini },
    "openrouter": { name: "openrouter", endpoint: "https://openrouter.ai/api/v1/chat/completions", model: "meta-llama/llama-3.1-8b-instruct:free", keys: API_KEYS.openrouter },
    "openai": { name: "openai", endpoint: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini", keys: API_KEYS.openai }
};
