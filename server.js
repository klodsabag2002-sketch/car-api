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

// cars-data.com: המפתח נקרא מהסביבה בלבד, לעולם לא נכתב בקוד
const CARS_DATA_KEY = process.env.CARS_DATA_KEY || "";
const CARS_DATA_BASE = "https://api.cars-data.com/v1";

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

// ---------- cars-data.com: תאוצה 0-100 ----------

// מטמון בזיכרון: כל רכב נשאל מול השירות פעם אחת בלבד
const accelCache = new Map();

// TODO: למלא אחרי שנמצא endpoint לחיפוש לפי יצרן, דגם ושנה. עד אז מחזיר null
async function findVariantId(manufacturer, model, year) {
    return null;
}

// מחפש בכל מבנה התשובה את השדה accel_0_100_s ומחזיר את הערך במספר שניות
function extractAccel(obj) {
    if (!obj || typeof obj !== "object") return null;
    if (obj.accel_0_100_s != null) {
        const v = obj.accel_0_100_s;
        const n = typeof v === "object" ? Number(v.v) : Number(v);
        return Number.isNaN(n) ? null : n;
    }
    for (const k of Object.keys(obj)) {
        const r = extractAccel(obj[k]);
        if (r !== null) return r;
    }
    return null;
}

async function fetchAcceleration(manufacturer, model, year) {
    if (!CARS_DATA_KEY) return null;

    const cacheKey = [manufacturer, model, year].join("|").toLowerCase();
    if (accelCache.has(cacheKey)) return accelCache.get(cacheKey);

    try {
        const variantId = await findVariantId(manufacturer, model, year);
        if (!variantId) {
            accelCache.set(cacheKey, null);
            return null;
        }

        const response = await fetch(`${CARS_DATA_BASE}/variants/${variantId}/specs?locale=he`, {
            headers: { "X-Api-Key": CARS_DATA_KEY }
        });
        if (!response.ok) return null;

        const data = await response.json();
        const seconds = extractAccel(data);
        const result = seconds !== null ? { seconds, source: "cars-data.com" } : null;

        accelCache.set(cacheKey, result);
        return result;
    } catch (e) {
        return null; // לא שומרים שגיאות רשת במטמון, כדי לנסות שוב בפעם הבאה
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

// כל שורות הבעלויות לרכב, ממוינות לפי התאריך
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

        const acceleration = await fetchAcceleration(manufacturer, model, year);

        console.log(`--------------------------------------------------`);
        console.log(`[SEARCH LOG] 🔍 מישהו חיפש רכב!`);
        console.log(`📅 זמן: ${timestamp}`);
        console.log(`🚗 מספר רכב: ${plate}`);
        console.log(`🏭 יצרן ודגם: ${manufacturer} ${model} ${trim || ""} (${year})`);
        console.log(`⚡ כוח סוס: ${hp != null ? hp : "לא ידוע"}`);
        console.log(`🏷️ סוג בעלות: ${currentOwnership || "לא ידוע"}`);
        console.log(`🏁 תאוצה 0-100: ${acceleration ? acceleration.seconds + " שניות" : "לא ידוע"}`);
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

// ---------- בדיקת חיבור ל-cars-data (זמנית) ----------
// פותחים בדפדפן: /api/test-accel
// המפתח לא מוצג בתשובה, רק מבנה התשובה ומה שנמצא
app.get('/api/test-accel', async (req, res) => {
    if (!CARS_DATA_KEY) {
        return res.json({ success: false, message: "CARS_DATA_KEY לא מוגדר ב-Render" });
    }
    try {
        const response = await fetch(`${CARS_DATA_BASE}/demo`, {
            headers: { "X-Api-Key": CARS_DATA_KEY }
        });
        const text = await response.text();
        let data = null;
        try { data = JSON.parse(text); } catch (e) { data = null; }

        res.json({
            success: response.ok,
            status: response.status,
            topLevelKeys: data && typeof data === "object" ? Object.keys(data) : [],
            accelFound: data ? extractAccel(data) : null,
            preview: data ? undefined : text.slice(0, 500)
        });
    } catch (e) {
        res.json({ success: false, message: "שגיאת רשת: " + e.message });
    }
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