// main.js
import makeWASocket, { 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    jidNormalizedUser 
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import cron from "node-cron";
import fs, { readdirSync, statSync, unlinkSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { 
    getSystem, getUserData, cleanJid, isBotAdmin, 
    spamCache, groupCache, logger 
} from "./helpers.js";

import { ALLOWED_GROUPS_NAMES, SECRET_ADMIN_PASSWORD } from "./config.js";
import { processCommand } from "./commands.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [tempDir, imagesDir, audioDir] = ["temp", "images", "audio"].map(dir => path.join(__dirname, dir));

[tempDir, imagesDir, audioDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version, auth: state, printQRInTerminal: false, logger: pino({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);
    
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            logger.info("⚠️ يرجى مسح رمز الـ QR التالي لبدء تشغيل البوت:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "close") {
            logger.info("❌ تم إنهاء الاتصال. جاري إعادة المحاولة خلال 3 ثوانٍ...");
            setTimeout(startBot, 3000);
        } else if (connection === "open") {
            logger.info("✅ تم ربط البوت بنجاح! نظام الاستشارات الاستراتيجية NEXUS يعمل بكفاءة.");
        }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        try {
            if (type !== "notify") return;
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const sender = jidNormalizedUser(msg.key.participant || from);
            const botJid = cleanJid(sock.user.id || sock.user.jid);
            const isGroup = from.endsWith('@g.us');

            const messageContent = msg.message.conversation || 
                                   msg.message.extendedTextMessage?.text || 
                                   msg.message.imageMessage?.caption || 
                                   msg.message.videoMessage?.caption || 
                                   msg.message.documentMessage?.caption || "";
            let text = messageContent.trim();
            
            if (!text.startsWith(".")) return;

            const sys = await getSystem();

            if (sys && sys.banned.includes(sender)) return;
            const isAdmin = await isBotAdmin(sender, sys);

            if (!isAdmin && spamCache.has(sender)) return;
            if (!isAdmin) spamCache.set(sender, true);

            if (text === SECRET_ADMIN_PASSWORD && !isAdmin) {
                if (sys) {
                    sys.admins.push(sender); 
                    await sys.save();
                }
                return sock.sendMessage(from, { text: "👑 تم تسجيل هويتك كمسؤول للنظام بنجاح." });
            }

            const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

            if (isGroup) {
                let groupName = groupCache.get(from);
                if (!groupName) {
                    try {
                        const metadata = await sock.groupMetadata(from);
                        groupName = metadata.subject;
                        groupCache.set(from, groupName);
                    } catch (e) {
                        logger.warn("فشل جلب اسم المجموعة: " + e.message);
                    }
                }
                
                const isGroupAllowed = ALLOWED_GROUPS_NAMES.length === 0 || ALLOWED_GROUPS_NAMES.includes(groupName);
                if (!isGroupAllowed) return;
            }

            const parts = text.split(" ");
            const cmd = parts[0].toLowerCase();
            const arg = parts.slice(1).join(" ");

            const handled = await processCommand({
                sock, msg, from, sender, botJid, isGroup, text, cmd, arg, isAdmin, sys, contextInfo
            });

            if (handled && sys) { 
                sys.stats.totalRequests += 1; 
                await sys.save(); 
            }

        } catch (globalErr) {
            logger.error("Error in Upsert Logic: " + globalErr.message);
        }
    });
}

cron.schedule("0 * * * *", () => {
    const now = Date.now();
    [tempDir, imagesDir, audioDir].forEach(dir => {
        try {
            readdirSync(dir).forEach(file => {
                const filePath = path.join(dir, file);
                if (now - statSync(filePath).mtimeMs > 7200000) unlinkSync(filePath); 
            });
        } catch (e) {}
    });
});

startBot().catch(err => {
    logger.error("Fatal Bot Error: " + err.message);
    process.exit(1);
});
