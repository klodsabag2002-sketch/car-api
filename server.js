const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const CAR_REGISTRY_ID = "053cea08-09bc-40ec-8f7a-156f0677aff3"; // מאגר רישוי רכבים
const MODELS_ID = "142afde2-6228-49f9-8a29-9b6c3a0cbe40";       // תוצרים ודגמים
const HISTORY_ID = "56063a99-8a3e-4ff4-912e-5966c0279bad";      // היסטוריית כלי רכב פרטיים (1)
const OWNERSHIP_ID = "bb2355dc-9ec7-4f06-9c3f-3344672171da";    // היסטוריית כלי רכב פרטיים (2): בעלויות
const DISABLED_ID = "c8b9f9c8-4612-4068-934f-d4acd2e3c06e";     // רכבים עם תג חניה לנכה

// RevCarData: המפתח נקרא מהסביבה בלבד (Render -> Environment), לעולם לא נכתב בקוד
const REVCAR_KEY = process.env.REVCAR_KEY || "";
const REVCAR_BASE = "https://api.revcardata.com";

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ---------- עזרים ----------

async function searchDatastore(resourceId, filters, limit = 100, q = "") {
    const f = filters ? `&filters=${encodeURIComponent(JSON.stringify(filters))}` : "";
    const qq = q ? `&q=${encodeURIComponent(q)}` : "";
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${resourceId}${f}${qq}&limit=${limit}`;
    const response = await fetch(url);
    const data = await response.json();
    return data?.success ? (data.result?.records || []) : [];
}

function toText(value) {
    if (value == null) return null;
    const s = String(value).trim();
    if (s === "" || /^dnf$/i.test(s)) return null;
    return s;
}

function toNumber(value) {
    const s = toText(value);
    if (s === null) return null;
    const n = Number(s.replace(/,/g, ""));
    return Number.isNaN(n) ? null : n;
}

// תרגום סוגי בעלות לעברית מובנת (ערך לא מוכר יוצג כמו שהוא)
const ORIGIN_LABELS = {
    "": "פרטי",
    "החכר": "החכרה (ליסינג)",
    "השכרה": "השכרה",
    "יבוא אישי": "יבוא אישי",
    "יבוא אישי-משומש": "יבוא אישי משומש",
    "מדינת ישראל": "רכב ממשלתי",
    "ביס לנהיגה\"": "בית ספר לנהיגה",
    "משומש מיבואן": "משומש מיבואן"
};

function labelOwnership(raw) {
    const t = toText(raw);
    if (t === null) return "פרטי";
    return ORIGIN_LABELS[t] || t;
}

// סוג הבעלות מהמאגר הראשי (שדה baalut ברשומת הרישוי). null אם השדה ריק
function labelRegistryOwnership(raw) {
    const t = toText(raw);
    if (t === null) return null;
    return ORIGIN_LABELS[t] || t;
}

function testStatus(expiry) {
    if (!expiry) return null;
    const d = new Date(expiry);
    if (isNaN(d)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
}

// בודק אם הרכב מופיע במאגר תגי הנכה. true = יש, false = אין, null = לא ניתן לבדוק
async function checkDisabled(plate) {
    try {
        const byFilter = await searchDatastore(DISABLED_ID, { mispar_rechev: Number(plate) }, 5);
        if (byFilter.length > 0) return true;

        const byText = await searchDatastore(DISABLED_ID, null, 50, plate);
        const found = byText.some(r =>
            Object.values(r).some(v => String(v).replace(/\D/g, "") === plate)
        );
        return found;
    } catch (e) {
        return null;
    }
}

// ---------- RevCarData ----------

// מטמון בזיכרון: כל רכב נשאל מול השירות פעם אחת בלבד
const accelCache = new Map();

async function revcarGet(path) {
    const response = await fetch(`${REVCAR_BASE}${path}`, {
        headers: { "X-Api-Key": REVCAR_KEY }
    });
    let data = null;
    try { data = await response.json(); } catch (e) { data = null; }
    return { ok: response.ok, status: response.status, data };
}

// משטח את האובייקט לזוגות: נתיב -> ערך
function flatten(obj, prefix = "", out = {}) {
    if (obj == null) return out;
    if (typeof obj !== "object") {
        out[prefix] = obj;
        return out;
    }
    for (const k of Object.keys(obj)) {
        flatten(obj[k], prefix ? `${prefix}.${k}` : k, out);
    }
    return out;
}

function pickNumber(flat, keywords) {
    for (const [path, val] of Object.entries(flat)) {
        const p = path.toLowerCase();
        if (!keywords.every(k => p.includes(k))) continue;
        const n = Number(String(val).replace(/[^\d.]/g, ""));
        if (!Number.isNaN(n) && n > 0) return n;
    }
    return null;
}

function extractAccel(flat) {
    for (const [path, val] of Object.entries(flat)) {
        const p = path.toLowerCase();
        if (!(p.includes("0-100") || p.includes("0_100") || p.includes("accel"))) continue;
        const n = Number(String(val).replace(/[^\d.]/g, ""));
        if (!Number.isNaN(n) && n > 0) return n;
    }
    return null;
}

// מחפש את כל הגרסאות של היצרן+דגם+שנה, ומחזיר את זו שתואמת לכוח הסוס ולנפח המנוע
async function findMatchingVariant(manufacturer, model, year, hp, engineCc) {
    const params = new URLSearchParams({ make: String(manufacturer), model: String(model), year: String(year) });
    const list = await revcarGet(`/vehicles?${params.toString()}`);
    if (!list.ok || !list.data) return null;

    const candidates = Array.isArray(list.data.data) ? list.data.data : [];

    for (const v of candidates) {
        const core = await revcarGet(`/${v.id}/core`);
        if (!core.ok || !core.data) continue;

        const flat = flatten(core.data);
        const power = pickNumber(flat, ["power"]) ?? pickNumber(flat, ["hp"]);
        const displacement = pickNumber(flat, ["displacement"]) ?? pickNumber(flat, ["capacity"]);

        const powerOk = hp == null || power == null || Math.abs(power - hp) <= 2;
        const engineOk = engineCc == null || displacement == null || Math.abs(displacement - engineCc) <= 30;
        if (!powerOk || !engineOk) continue;

        const seconds = extractAccel(flat);
        if (seconds !== null) return { id: v.id, name: v.trim || v.model, seconds };
    }
    return null;
}

async function fetchAcceleration(manufacturer, model, year, hp, engineCc) {
    if (!REVCAR_KEY) return null;

    const cacheKey = [manufacturer, model, year, hp, engineCc].join("|").toLowerCase();
    if (accelCache.has(cacheKey)) return accelCache.get(cacheKey);

    try {
        const match = await findMatchingVariant(manufacturer, model, year, hp, engineCc);
        const result = match ? { seconds: match.seconds, source: "RevCarData", variant: match.name } : null;
        accelCache.set(cacheKey, result);
        return result;
    } catch (e) {
        return null;
    }
}

// ---------- מאגרים ----------

async function fetchCarRecord(plate) {
    const records = await searchDatastore(CAR_REGISTRY_ID, { mispar_rechev: Number(plate) }, 1);
    return records[0] || null;
}

async function fetchHistoryRecord(plate) {
    const records = await searchDatastore(HISTORY_ID, { mispar_rechev: Number(plate) }, 1);
    return records[0] || null;
}

async function fetchOwnershipRows(plate) {
    const rows = await searchDatastore(OWNERSHIP_ID, { mispar_rechev: Number(plate) }, 100);
    return rows
        .map(r => ({ date: toText(r.baalut_dt), type: labelOwnership(r.baalut) }))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function buildHistory(h) {
    if (!h) return null;

    const changes = [];
    if (Number(h.shinui_mivne_ind) === 1) changes.push("שינוי במבנה הרכב");
    if (Number(h.shnui_zeva_ind) === 1) changes.push("שינוי צבע");
    if (Number(h.shinui_zmig_ind) === 1) changes.push("שינוי צמיגים");

    return {
        origin: labelOwnership(h.mkoriut_nm),
        firstRegistration: toText(h.rishum_rishon_dt),
        kmSinceTest: toNumber(h.kilometer_test_aharon),
        changes
    };
}

async function findModelRow(car) {
    const year = car.shnat_yitzur != null ? Number(car.shnat_yitzur) : null;

    const attempts = [];
    if (car.tozeret_cd != null && car.degem_cd != null && year) {
        attempts.push({ tozeret_cd: Number(car.tozeret_cd), degem_cd: Number(car.degem_cd), shnat_yitzur: year });
    }
    if (car.degem_nm && year) {
        attempts.push({ degem_nm: String(car.degem_nm), shnat_yitzur: year });
    }

    for (const filters of attempts) {
        const rows = await searchDatastore(MODELS_ID, filters, 100);
        if (rows.length === 0) continue;
        return rows.find(r => toNumber(r.koah_sus) != null) || rows[0];
    }
    return null;
}

// ---------- API ----------

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate.replace(/\D/g, "");
    const timestamp = new Date().toISOString();

    try {
        const car = await fetchCarRecord(plate);

        if (!car) {
            console.warn(`[SEARCH LOG] ❌ 🚗 חיפוש רכב (לא נמצא במאגר): מספר ${plate} | שעה: ${timestamp}`);
            return res.json({ success: false, message: "המספר אינו קיים במאגר משרד התחבורה" });
        }

        const [row, historyRaw, ownershipList, disabled] = await Promise.all([
            findModelRow(car),
            fetchHistoryRecord(plate),
            fetchOwnershipRows(plate),
            checkDisabled(plate)
        ]);
        const history = buildHistory(historyRaw);

        const manufacturer = car.tozeret_nm || "לא ידוע";
        const model = car.kinuy_mishari || car.degem_nm || row?.kinuy_mishari || "לא ידוע";
        const trim = toText(row?.ramat_gimur) || toText(car.ramat_gimur) || null;
        const year = car.shnat_yitzur || "לא ידוע";
        const hp = toNumber(row?.koah_sus) ?? toNumber(car.koah_sus);
        const engineCc = toNumber(row?.nefah_manoa) ?? toNumber(car.nefah_manoa);
        const testExpiry = car.tokef_dt || null;

        const registryOwnership = labelRegistryOwnership(car.baalut);
        const historyOwnership = ownershipList.length
            ? ownershipList[ownershipList.length - 1].type
            : (history?.origin ?? null);
        const currentOwnership = registryOwnership || historyOwnership;

        const acceleration = await fetchAcceleration(manufacturer, model, year, hp, engineCc);

        console.log(`--------------------------------------------------`);
        console.log(`[SEARCH LOG] 🔍 מישהו חיפש רכב!`);
        console.log(`📅 זמן: ${timestamp}`);
        console.log(`🚗 מספר רכב: ${plate}`);
        console.log(`🏭 יצרן ודגם: ${manufacturer} ${model} ${trim || ""} (${year})`);
        console.log(`⚡ כוח סוס: ${hp != null ? hp : "לא ידוע"} | נפח: ${engineCc != null ? engineCc : "לא ידוע"}`);
        console.log(`🏷️ סוג בעלות: ${currentOwnership || "לא ידוע"}`);
        console.log(`🏁 תאוצה 0-100: ${acceleration ? acceleration.seconds + " שניות" : "לא נמצאה גרסה תואמת"}`);
        console.log(`♿ תג נכה: ${disabled === null ? "לא ידוע" : (disabled ? "יש" : "אין")}`);
        console.log(`🔁 מעברי בעלות: ${ownershipList.length}`);
        console.log(`--------------------------------------------------`);

        res.json({
            success: true,
            data: {
                plate,
                manufacturer,
                model,
                trim,
                year,
                color: car.zeva_rechev || car.tzeva_rechev || "לא ידוע",
                chassis: toText(car.misgeret),
                tireFront: toText(car.zmig_kidmi),
                tireRear: toText(car.zmig_ahori),
                lastTest: toText(car.mivchan_acharon_dt),
                engineCc,
                horsepower: hp,
                acceleration0to100: acceleration ? acceleration.seconds : null,
                accelerationSource: acceleration ? acceleration.source : null,
                accelerationVariant: acceleration ? acceleration.variant : null,
                testExpiry,
                testValid: testStatus(testExpiry),
                ownership: currentOwnership,
                firstRegistration: history?.firstRegistration ?? null,
                changes: history?.changes ?? [],
                owners: ownershipList.length || null,
                disabled,
                kmSinceTest: history?.kmSinceTest ?? null
            }
        });
    } catch (error) {
        console.error(`[SEARCH LOG] 💥 שגיאה בחיפוש מספר ${plate}:`, error);
        res.status(500).json({ success: false, error: "שגיאה בשליפה" });
    }
});

app.get('/api/history/:plate', async (req, res) => {
    const plate = req.params.plate.replace(/\D/g, "");
    try {
        const [historyRaw, ownershipList] = await Promise.all([
            fetchHistoryRecord(plate),
            fetchOwnershipRows(plate)
        ]);
        const history = buildHistory(historyRaw);
        if (!history && ownershipList.length === 0) {
            return res.json({ success: false, message: "לא נמצאה היסטוריה לרכב זה" });
        }
        res.json({ success: true, history: history || {}, ownershipList });
    } catch (e) {
        res.status(500).json({ success: false, message: "שגיאה בשליפת ההיסטוריה" });
    }
});

// ---------- אבחון מלא של RevCarData ----------
// פותחים: /api/diagnose-revcar?make=Skoda&model=Fabia&year=2013
// מנסה כמה צורות של חיפוש, מציג את כל הגרסאות שחזרו, ואת כל השדות של core ו-premium
// (בלי המפתח). כל הפתיחה צורכת כ-6 בקשות מתוך 100 החודשיות.
app.get('/api/diagnose-revcar', async (req, res) => {
    if (!REVCAR_KEY) {
        return res.json({ success: false, message: "REVCAR_KEY לא מוגדר ב-Render" });
    }

    const make = req.query.make || "Skoda";
    const model = req.query.model || "Fabia";
    const year = req.query.year || "2013";

    const out = { query: { make, model, year }, searchAttempts: [], firstVariant: null };

    // 1. ננסה כמה צורות של פרמטרים, ונרשום מה חזר בכל אחת
    const attempts = [
        { label: "make/model/year", qs: { make, model, year } },
        { label: "manufacturer/model/year", qs: { manufacturer: make, model, year } },
        { label: "q (חיפוש חופשי)", qs: { q: `${make} ${model} ${year}` } }
    ];

    let firstList = null;
    for (const a of attempts) {
        const r = await revcarGet(`/vehicles?${new URLSearchParams(a.qs).toString()}`);
        const list = r.data && Array.isArray(r.data.data) ? r.data.data : [];
        out.searchAttempts.push({
            label: a.label,
            status: r.status,
            topLevelKeys: r.data ? Object.keys(r.data) : [],
            count: list.length,
            samples: list.slice(0, 5).map(v => {
                const { id, ...rest } = v;
                return { id, ...rest };
            })
        });
        if (!firstList && list.length > 0) firstList = list;
    }

    // 2. לגרסה הראשונה שנמצאה, נשלוף את כל השדות של core ו-premium
    if (firstList) {
        const v = firstList[0];
        out.firstVariant = { id: v.id, name: v.trim || v.model || null };

        const core = await revcarGet(`/${v.id}/core`);
        const premium = await revcarGet(`/${v.id}/premium`);

        const coreFlat = flatten(core.data);
        const premiumFlat = flatten(premium.data);

        out.core = {
            status: core.status,
            fieldCount: Object.keys(coreFlat).length,
            fields: Object.entries(coreFlat).slice(0, 300).map(([k, val]) => ({
                path: k,
                value: String(val).slice(0, 80)
            }))
        };
        out.premium = {
            status: premium.status,
            fieldCount: Object.keys(premiumFlat).length,
            fields: Object.entries(premiumFlat).slice(0, 300).map(([k, val]) => ({
                path: k,
                value: String(val).slice(0, 80)
            }))
        };
        out.accelInCore = extractAccel(coreFlat);
        out.accelInPremium = extractAccel(premiumFlat);
    } else {
        out.message = "לא נמצאה אף גרסה באף אחת מצורות החיפוש. צריך לבדוק את תיעוד /vehicles.";
    }

    res.json(out);
});

app.get('/api/debug/:plate', async (req, res) => {
    try {
        const car = await fetchCarRecord(req.params.plate);
        if (!car) return res.json({ success: false, message: "לא נמצא" });
        const row = await findModelRow(car);
        const hist = await fetchHistoryRecord(req.params.plate);
        const own = await fetchOwnershipRows(req.params.plate);
        const disabledSample = await searchDatastore(DISABLED_ID, null, 1);
        const disabledMatch = await checkDisabled(req.params.plate);
        res.json({
            success: true,
            car_fields: Object.keys(car),
            car,
            model_row: row,
            history: hist,
            ownership: own,
            disabled_sample_fields: disabledSample[0] ? Object.keys(disabledSample[0]) : [],
            disabled_sample: disabledSample[0] || null,
            disabled_match: disabledMatch
        });
    } catch (error) {
        console.error("שגיאה:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`השרת רץ בפורט ${PORT}`);
});