// database.js
import mongoose from "mongoose";
import pino from "pino";
import { MONGODB_URI, FOUNDER_JID } from "./config.js";

const logger = pino({ level: "info" });

if (!MONGODB_URI) {
    console.error("❌ ERROR: MONGODB_URI parameter is missing in .env");
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => logger.info("✅ Database connection established successfully!"))
    .catch(err => { 
        logger.error("❌ Database connection error: " + err.message); 
        process.exit(1); 
    });

const UserSchema = new mongoose.Schema({
    jid: { type: String, unique: true, required: true },
    name: { type: String, default: "مستكشف صامت" },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    class: { type: String, default: "مخطط مبتدئ" },
    selectedModel: { type: String, default: "kimi2.6" },
    createdAt: { type: Date, default: Date.now }
});

const StrategySandboxSchema = new mongoose.Schema({
    groupId: { type: String, unique: true, required: true },
    theme: { type: String, default: "غير محدد" },
    round: { type: Number, default: 1 },
    resources: {
        budget: { type: Number, default: 1000 },
        reputation: { type: Number, default: 70 },
        stability: { type: Number, default: 80 }
    },
    activeCrisis: { type: String, default: "لا توجد أزمة حالية. استخدم .crisis لتوليد تحدٍ جديد." },
    history: { type: Array, default: [] },
    activeModel: { type: String, default: "kimi2.6" },
    updatedAt: { type: Date, default: Date.now }
});

const SystemSchema = new mongoose.Schema({
    id: { type: String, default: "system" },
    admins: { type: Array, default: [FOUNDER_JID] },
    banned: { type: Array, default: [] },
    welcomeMsg: { type: String, default: "⚙️ مرحباً بك في نظام NEXUS التفاعلي لإدارة المحاكاة الاستراتيجية. أرسل .menu للبدء." },
    stats: { totalRequests: { type: Number, default: 0 } },
});

// الحماية من مشكلة OverwriteModelError أثناء التطوير وإعادة التشغيل
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const StrategySandbox = mongoose.models.StrategySandbox || mongoose.model("StrategySandbox", StrategySandboxSchema);
export const System = mongoose.models.System || mongoose.model("System", SystemSchema);
