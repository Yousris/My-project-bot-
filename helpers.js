// helpers.js
import axios from "axios";
import NodeCache from "node-cache";
import pino from "pino";
import { User, System, StrategySandbox } from "./database.js";
import { BOT_ADMIN_JIDS, FOUNDER_JID, AI_MODELS } from "./config.js";

export const logger = pino({ level: "info" });
export const spamCache = new NodeCache({ stdTTL: 3, checkperiod: 1 });
export const groupCache = new NodeCache({ stdTTL: 1800, checkperiod: 300 });

export function cleanJid(jid) {
    if (!jid) return "";
    return jid.split(":")[0].split("@")[0] + "@s.whatsapp.net";
}

export async function getSystem() {
    let sys = await System.findOne({ id: "system" });
    if (!sys) sys = await System.create({ id: "system" });
    return sys;
}

export async function getUserData(jid) {
    const cleaned = cleanJid(jid);
    let user = await User.findOne({ jid: cleaned });
    if (!user) user = await User.create({ jid: cleaned });
    return user;
}

export async function getGroupSandbox(groupId) {
    let sandbox = await StrategySandbox.findOne({ groupId });
    if (!sandbox) {
        sandbox = await StrategySandbox.create({ 
            groupId,
            resources: { budget: 1000, reputation: 70, stability: 80 }
        });
    }
    return sandbox;
}

export async function isBotAdmin(sender, sys) {
    const senderClean = cleanJid(sender);
    const founderClean = cleanJid(FOUNDER_JID);
    const adminsClean = (sys?.admins || []).map(a => cleanJid(a));
    const botAdminsClean = BOT_ADMIN_JIDS.map(a => cleanJid(a));
    return adminsClean.includes(senderClean) || botAdminsClean.includes(senderClean) || senderClean === founderClean;
}

export async function checkGroupAdmins(sock, groupJid, senderJid) {
    try {
        const metadata = await sock.groupMetadata(groupJid);
        const participants = metadata.participants;
        const botJid = cleanJid(sock.user.id || sock.user.jid);
        const senderJidClean = cleanJid(senderJid);
        
        const botPart = participants.find(p => cleanJid(p.id) === botJid);
        const senderPart = participants.find(p => cleanJid(p.id) === senderJidClean);
        
        const isBotGroupAdmin = botPart && (botPart.admin === "admin" || botPart.admin === "superadmin");
        const isSenderGroupAdmin = senderPart && (senderPart.admin === "admin" || senderPart.admin === "superadmin");
        
        return { isBotGroupAdmin, isSenderGroupAdmin, participants };
    } catch (e) {
        return { isBotGroupAdmin: false, isSenderGroupAdmin: false, participants: [] };
    }
}

export async function addXP(user, amount, sock, from, msg) {
    user.xp += amount;
    const nextLevelXP = user.level * 100;
    let leveledUp = false;
    if (user.xp >= nextLevelXP) {
        user.level += 1;
        user.xp = user.xp - nextLevelXP;
        leveledUp = true;
        
        if (user.level >= 15) user.class = "رئيس مجلس التخطيط";
        else if (user.level >= 10) user.class = "مستشار استراتيجي نخبوي";
        else if (user.level >= 5) user.class = "منسق عمليات ميداني";
        else user.class = "محلل مخاطر ناشئ";
    }
    await user.save();
    if (leveledUp) {
        await sock.sendMessage(from, { 
            text: `📈 *ترقية في الرتبة الاستراتيجية!* \n👤 المخطط: @${user.jid.split('@')[0]}\n📊 المستوى الجديد: *${user.level}*\n🏆 اللقب القيادي: *${user.class}*`, 
            mentions: [user.jid] 
        }, { quoted: msg });
    }
}

export const react = async (sock, from, key, emoji) => {
    try { await sock.sendMessage(from, { react: { text: emoji, key } }); } catch (e) {}
};

export const DEFAULT_PERSONA = `أنت NEXUS STRATEGIST، نظام محاكاة استراتيجية واستشاري أزمات متكامل.
مهمتك إدارة ومحاكاة غرف العمليات والتخطيط الجماعي للمجموعات بنضوج وهدوء تام.
تُجيب بأسلوب ذكي بالدارجة المغربية المكتوبة بأحرف عربية وبتنسيق احترافي.`;

export async function askAI(prompt, modelKey = "kimi2.6", systemInstruction = DEFAULT_PERSONA) {
    const selected = AI_MODELS[modelKey] || AI_MODELS["kimi2.6"];
    
    if (!selected.keys || selected.keys.length === 0) {
        logger.warn(`⚠️ No keys found for model ${modelKey}, trying fallback...`);
        const fallbackKey = Object.keys(AI_MODELS).find(k => AI_MODELS[k].keys && AI_MODELS[k].keys.length > 0);
        if (!fallbackKey) return "❌ واجه النظام صعوبة في الوصول لمفاتيح الاستعلام المعرفي حالياً.";
        return askAI(prompt, fallbackKey, systemInstruction);
    }

    const randomKey = selected.keys[Math.floor(Math.random() * selected.keys.length)];
    const messagesArray = [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
    ];

    try {
        const res = await axios.post(selected.endpoint, {
            model: selected.model,
            messages: messagesArray,
            temperature: 0.7,
            max_tokens: 1500
        }, {
            headers: { 
                Authorization: `Bearer ${randomKey}`, 
                "Content-Type": "application/json" 
            },
            timeout: 25000
        });

        if (res.data && res.data.choices) {
            return res.data.choices[0].message.content;
        }
    } catch (err) {
        logger.error(`⚠️ Request via ${selected.name} failed: ${err.message}`);
        if (modelKey !== "kimi2.6") {
            return askAI(prompt, "kimi2.6", systemInstruction);
        }
    }
    return "❌ تعذر تلقي استجابة تحليلية من خوادم الذكاء الاصطناعي المتاحة.";
}
