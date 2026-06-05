// commands.js
import { AI_MODELS } from "./config.js";
import { 
    getUserData, getGroupSandbox, checkGroupAdmins, react, askAI, addXP 
} from "./helpers.js";

const NEXUS_MENU = `🔮 *بوابة المحاكاة الاستراتيجية وإدارة الأزمات [NEXUS STRATEGIST]* 🔮

⚙️ *[ خيارات التحكم الإداري والهوية ]*
» *.menu* ⇽ عرض اللائحة الاستراتيجية الراهنة.
» *.model [اسم_الموديل]* ⇽ تغيير معالج الوعي الخاص بك أو بالمجموعة.
» *.profile* ⇽ مراجعة رتبتك القيادية ومستوى طاقتك.

📈 *[ محرك إدارة الأزمات والخطط الجماعية ]*
» *.init [فكرة_المحاكاة]* ⇽ إطلاق مشروع أو سيناريو تخطيط استراتيجي بالمجموعة.
» *.status* ⇽ كشف الموارد، السمعة، الاستقرار، والأزمة الجارية.
» *.action [الخطة]* ⇽ تقديم مقترح استراتيجي لمعالجة الوضع وتطوير الموارد.
» *.crisis* ⇽ استدعاء أزمة مفاجئة لتحفيز المجموعات وتحدي المتواجدين.
» *.advisor* ⇽ توليد تحليل استشاري معمق ومطول للمحاكاة القائمة.

🧠 *[ الاستعلام الاستشاري المباشر ]*
» *.ai [سؤال]* ⇽ استشارة مخصصة للذكاء الاصطناعي بناءً على النموذج النشط حالياً.`;

const ADMIN_MENU = `

👑 *[ خيارات الإشراف والمراقبة ]*
» *.ban [الرقم]* ⇽ منع معرف محدد من استخدام البوت.
» *.unban [الرقم]* ⇽ رفع القيد وإعادة الصلاحية للمعرف.
» *.stats* ⇽ مراجعة إحصائيات الخادم وأدائه.
» *.broadcast [الرسالة]* ⇽ بث توجيهي لكافة المشتركين.`;

export async function processCommand({ sock, msg, from, sender, botJid, isGroup, text, cmd, arg, isAdmin, sys, contextInfo }) {
    let handled = true;

    const user = await getUserData(sender);
    const sandbox = isGroup ? await getGroupSandbox(from) : null;
    const groupData = isGroup ? await checkGroupAdmins(sock, from, sender) : { isBotGroupAdmin: false, isSenderGroupAdmin: false, participants: [] };

    const activeModelKey = (isGroup ? sandbox?.activeModel : user?.selectedModel) || "kimi2.6";

    switch (cmd) {
        case ".menu":
        case ".help":
            let menuText = NEXUS_MENU;
            if (isAdmin) {
                menuText += ADMIN_MENU;
            }
            await sock.sendMessage(from, { text: menuText }, { quoted: msg });
            break;

        case ".profile":
            const progress = user.xp / (user.level * 100);
            const progressBar = "▓".repeat(Math.round(progress * 10)) + "░".repeat(10 - Math.round(progress * 10));
            const pText = `🌐 *البطاقة الاستراتيجية للمخطط:*
            
👤 الإسم: *${user.name}*
🏆 الرتبة القيادية: [ *${user.class}* ]
📊 نموذج التحليل النشط لحسابك: *${user.selectedModel}*

📈 *[ مؤشر الكفاءة والخبرة ]*
» المستوى المعرفي: *${user.level}*
» نقاط الخبرة: *${user.xp} / ${user.level * 100}*
└ [${progressBar}] ${Math.round(progress * 100)}%`;
            await sock.sendMessage(from, { text: pText }, { quoted: msg });
            break;

        case ".model":
            if (!arg) {
                const availableList = Object.keys(AI_MODELS).map(k => `» *${k}* (${AI_MODELS[k].name})`).join("\n");
                await sock.sendMessage(from, { 
                    text: `⚙️ *تخصيص نموذج الاستدلال والتحليل لـ NEXUS:*\n\nالموديلات المتوفرة حالياً:\n${availableList}\n\nتغيير الموديل الفردي أو الجروب عبر كتابة الأمر تالياً بـاسم الموديل الدقيق:\nمثال: \`.model gemini\`` 
                }, { quoted: msg });
                break;
            }

            const targetModel = arg.trim().toLowerCase();
            if (!AI_MODELS[targetModel]) {
                await sock.sendMessage(from, { text: "❌ الموديل الذي أدخلته غير متوفر في قائمة الموديلات المدعومة حالياً." }, { quoted: msg });
                break;
            }

            if (isGroup) {
                if (!groupData.isSenderGroupAdmin && !isAdmin) {
                    await sock.sendMessage(from, { text: "❌ هذا الإجراء متاح فقط لمشرفي المجموعة للحفاظ على استقرار اللعبة." }, { quoted: msg });
                    break;
                }
                if (sandbox) {
                    sandbox.activeModel = targetModel;
                    await sandbox.save();
                }
                await react(sock, from, msg.key, "⚙️");
                await sock.sendMessage(from, { text: `⚙️ تم تحديث النموذج التحليلي للمجموعة بنجاح إلى: *${targetModel}*` }, { quoted: msg });
            } else {
                user.selectedModel = targetModel;
                await user.save();
                await react(sock, from, msg.key, "⚙️");
                await sock.sendMessage(from, { text: `⚙️ تم تحديث نموذجك الشخصي بنجاح إلى: *${targetModel}*` }, { quoted: msg });
            }
            break;

        case ".ai":
            if (!arg) {
                await sock.sendMessage(from, { text: "⚠️ يرجى كتابة الاستفسار أو القضية الفكرية التي ترغب في تحليلها بعد الأمر." }, { quoted: msg });
                break;
            }
            await react(sock, from, msg.key, "🧠");
            await sock.sendPresenceUpdate('composing', from);

            const aiReply = await askAI(arg, activeModelKey);
            await sock.sendMessage(from, { text: aiReply }, { quoted: msg });
            await addXP(user, 3, sock, from, msg);
            break;

        case ".init":
            if (!isGroup || !sandbox) {
                await sock.sendMessage(from, { text: "❌ هذا المحرك الاستراتيجي مخصص للعمل الجماعي داخل المجموعات فقط." }, { quoted: msg });
                break;
            }
            if (!arg) {
                await sock.sendMessage(from, { text: "⚠️ حدد موضوع المحاكاة الاستراتيجية للمجموعة. مثال:\n`.init بناء شركة ناشئة برمجية بالمغرب`" }, { quoted: msg });
                break;
            }

            await react(sock, from, msg.key, "🏛️");
            
            sandbox.theme = arg.trim();
            sandbox.round = 1;
            sandbox.resources = { budget: 1000, reputation: 70, stability: 80 };
            sandbox.activeCrisis = "لا توجد أزمة حالية. أرسل .crisis لتوليد تحدٍ ميداني جديد للمجموعة.";
            sandbox.history = [];
            await sandbox.save();

            const initPrompt = `تم البدء في محاكاة استراتيجية جديدة للمجموعة تحت عنوان: "${arg}".
قم بكتابة مقدمة حماسية وممتعة بالدارجة المغربية تشرح فيها طبيعة المشروع، الأهداف والمهام الاستراتيجية المطلوبة منهم.`;
            
            const initBrief = await askAI(initPrompt, activeModelKey);
            await sock.sendMessage(from, { 
                text: `🏛️ *تم إطلاق سيناريو المحاكاة الاستراتيجية بنجاح!* 🏛️\n\n${initBrief}\n\n👉 أرسل *.status* لعرض مؤشرات الموارد الحالية والمتابعة.` 
            }, { quoted: msg });
            break;

        case ".status":
            if (!isGroup || !sandbox) break;
            if (sandbox.theme === "غير محدد") {
                await sock.sendMessage(from, { text: "❌ لا توجد محاكاة نشطة حالياً. ابدأ بإطلاق واحدة عبر الأمر: `.init [فكرة المحاكاة]`" }, { quoted: msg });
                break;
            }

            const currentResources = sandbox.resources || { budget: 1000, reputation: 70, stability: 80 };

            const statusReport = `📊 *التقرير الراهن لغرفة العمليات للمجموعة:*

✨ *[ موضوع المحاكاة ]*
» العنوان: *${sandbox.theme}*
» الجولة الحالية: [ *${sandbox.round}* ]
» نموذج الذكاء الاصطناعي المعتمد: *${sandbox.activeModel}*

📈 *[ مؤشر الموارد الحالية ]*
» 💰 الميزانية العامة: *${currentResources.budget}* مليون دولار
» 🤝 السمعة العامة: *${currentResources.reputation} / 100*
» 🛡️ مؤشر الاستقرار والأمن الداخلي: *${currentResources.stability} / 100*

⚠️ *[ الأزمة الحالية المطروحة ]*
└ ${sandbox.activeCrisis}

👉 لمعالجة الأزمات أو اتخاذ قرارات تكتيكية، أرسل:
\`.action [الخطة أو القرار الجماعي المقترح]\``;
            await sock.sendMessage(from, { text: statusReport }, { quoted: msg });
            break;

        case ".action":
            if (!isGroup || !sandbox) break;
            if (sandbox.theme === "غير محدد") {
                await sock.sendMessage(from, { text: "❌ يرجى تهيئة محاكاة أولاً عبر الأمر `.init`" }, { quoted: msg });
                break;
            }
            if (!arg) {
                await sock.sendMessage(from, { text: "⚠️ يرجى صياغة واقتراح الخطة الاستراتيجية بدقة بعد الأمر." }, { quoted: msg });
                break;
            }

            await react(sock, from, msg.key, "⚡");
            await sock.sendPresenceUpdate('composing', from);

            const safeResources = sandbox.resources || { budget: 1000, reputation: 70, stability: 80 };

            const evalPrompt = `نحن في محاكاة استراتيجية تفاعلية بعنوان: "${sandbox.theme}".
- الجولة الحالية: ${sandbox.round}
- الموارد المتبقية: ميزانية (${safeResources.budget}), سمعة (${safeResources.reputation}/100), استقرار (${safeResources.stability}/100).
- الأزمة القائمة حالياً: "${sandbox.activeCrisis}".

أعضاء مجلس الإدارة اقترحوا القرار التالي: "${arg}".

بناءً على هذا القرار، قم بتحليل آثاره بعقلانية تامة بالدارجة المغربية.
ثم قم بإعادة إعدادات الموارد الجديدة للمحاكاة بالزيادة أو النقصان عبر الالتزام الدقيق بإنتاج التنسيق التالي في نهاية الرد:
[STATS_UPDATE]
BUDGET: [إما معامل زيادة أو نقصان، مثلاً -150 أو +100]
REPUTATION: [إما معامل زيادة أو نقصان، مثلاً +10 أو -5]
STABILITY: [إما معامل زيادة أو نقصان، مثلاً +5 أو -10]`;

            const evaluation = await askAI(evalPrompt, activeModelKey);

            let updatedText = evaluation;
            const statsBlock = evaluation.split("[STATS_UPDATE]");
            
            if (!sandbox.resources) {
                sandbox.resources = { budget: 1000, reputation: 70, stability: 80 };
            }

            if (statsBlock.length > 1) {
                updatedText = statsBlock[0].trim();
                const numData = statsBlock[1];
                
                const budgetMatch = numData.match(/BUDGET:\s*([-+]\d+)/i);
                const repMatch = numData.match(/REPUTATION:\s*([-+]\d+)/i);
                const stabMatch = numData.match(/STABILITY:\s*([-+]\d+)/i);

                if (budgetMatch) sandbox.resources.budget += parseInt(budgetMatch[1]);
                if (repMatch) sandbox.resources.reputation = Math.max(0, Math.min(100, sandbox.resources.reputation + parseInt(repMatch[1])));
                if (stabMatch) sandbox.resources.stability = Math.max(0, Math.min(100, sandbox.resources.stability + parseInt(stabMatch[1])));
                
                if (sandbox.resources.budget < 0) sandbox.resources.budget = 0;
            }

            sandbox.round += 1;
            sandbox.activeCrisis = "الأزمة تم التعامل معها بنجاح! يمكنكم توليد أزمة جديدة عبر .crisis";
            sandbox.history.push({ round: sandbox.round - 1, action: arg });
            sandbox.markModified("resources");
            await sandbox.save();

            await sock.sendMessage(from, { 
                text: `⚡ *تم تحليل وتقييم قراركم الاستراتيجي للجولة [ ${sandbox.round - 1} ] :* ⚡\n\n${updatedText}\n\n📊 أرسل *.status* لملاحظة التغير في الموارد والأرقام.` 
            }, { quoted: msg });

            await addXP(user, 10, sock, from, msg);
            break;

        case ".crisis":
            if (!isGroup || !sandbox) break;
            if (sandbox.theme === "غير محدد") {
                await sock.sendMessage(from, { text: "❌ لا توجد محاكاة نشطة لاستدعاء أزمة لها حالياً." }, { quoted: msg });
                break;
            }

            await react(sock, from, msg.key, "🚨");
            await sock.sendPresenceUpdate('composing', from);

            const currentRes = sandbox.resources || { budget: 1000, reputation: 70, stability: 80 };

            const crisisPrompt = `المحاكاة الجارية حالياً: "${sandbox.theme}".
الوضع والموارد الراهنة: ميزانية (${currentRes.budget}), سمعة (${currentRes.reputation}/100), استقرار (${currentRes.stability}/100).
قم بتوليد أزمة طارئة وجديدة كلياً تناسب موضوع المحاكاة. اشرح الأزمة بالدارجة المغربية بأسلوب مشوق.`;

            const generatedCrisis = await askAI(crisisPrompt, activeModelKey);
            sandbox.activeCrisis = generatedCrisis;
            await sandbox.save();

            await sock.sendMessage(from, { 
                text: `🚨 *تنبيه أمني وعملياتي طارئ!* 🚨\n\n${generatedCrisis}\n\n👉 اقترحوا خطة للتعامل مع هذا التهديد عبر: \n\`.action [الخطة المقترحة]\`` 
            }, { quoted: msg });
            break;

        case ".advisor":
            if (!isGroup || !sandbox) break;
            if (sandbox.theme === "غير محدد") {
                await sock.sendMessage(from, { text: "❌ لا توجد محاكاة جارية لطلب الاستشارة." }, { quoted: msg });
                break;
            }

            await react(sock, from, msg.key, "🎓");
            await sock.sendPresenceUpdate('composing', from);

            const advRes = sandbox.resources || { budget: 1000, reputation: 70, stability: 80 };

            const advisorPrompt = `أنت المستشار الاستراتيجي الأول والناصح المالي للكيان: "${sandbox.theme}".
المعطيات الراهنة: الجولة (${sandbox.round}), ميزانية (${advRes.budget}), سمعة (${advRes.reputation}), استقرار (${advRes.stability}).
قم بتقديم تقرير استشاري ونقدي مفصل بالدارجة المغربية لأداء مجلس الإدارة.`;

            const advice = await askAI(advisorPrompt, activeModelKey);
            await sock.sendMessage(from, { 
                text: `🎓 *تقرير الخبير الاستشاري لـ NEXUS:* 🎓\n\n${advice}` 
            }, { quoted: msg });
            break;

        case ".stats":
            if (!isAdmin) break;
            const totalU = await User.countDocuments();
            await sock.sendMessage(from, { text: `📊 *إحصائيات خادم NEXUS:*\n» الأعضاء النشطين: ${totalU}\n» الطلبات الكلية المعالجة: ${sys?.stats?.totalRequests || 0}` }, { quoted: msg });
            break;

        case ".ban":
            if (!isAdmin) break;
            const banTarget = arg.replace(/\D/g, "") + "@s.whatsapp.net";
            if (sys && !sys.banned.includes(banTarget)) { 
                sys.banned.push(banTarget); 
                await sys.save(); 
            }
            await sock.sendMessage(from, { text: "🚫 تم حظر المعرف بنجاح من الوصول لنواة النظام." }, { quoted: msg });
            break;

        case ".unban":
            if (!isAdmin) break;
            if (sys) {
                sys.banned = sys.banned.filter(n => n !== arg.replace(/\D/g, "") + "@s.whatsapp.net"); 
                await sys.save();
            }
            await sock.sendMessage(from, { text: "✅ تم فك القيد وإعادة تفعيل الصلاحية للمعرف المحدد." }, { quoted: msg });
            break;

        default:
            handled = false;
            break;
    }

    return handled;
}
