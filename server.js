const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const CAR_REGISTRY_ID = "053cea08-09bc-40ec-8f7a-156f0677aff3"; // מאגר רישוי רכבים
const MODELS_ID = "142afde2-6228-49f9-8a29-9b6c3a0cbe40";       // תוצרים ודגמים
// מזהה המשאב של "מאגר היסטוריית כלי רכב פרטיים". ריק = ההיסטוריה כבויה
const HISTORY_ID = "";

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ---------- עזרים ----------

async function searchDatastore(resourceId, filters, limit = 100) {
    const f = filters ? `&filters=${encodeURIComponent(JSON.stringify(filters))}` : "";
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${resourceId}${f}&limit=${limit}`;
    const response = await fetch(url);
    const data = await response.json();
    return data?.success ? (data.result?.records || []) : [];
}

// טקסט נקי. DNF או ריק = null
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

// הערך הראשון שאינו ריק מבין שמות השדות שנבדקים
function pick(record, keys) {
    for (const k of keys) {
        const v = toText(record[k]);
        if (v !== null) return v;
    }
    return null;
}

// שמות אפשריים לשדות שאינם מאומתים. הדיבוג מראה את השמות האמיתיים
const KEYS = {
    ownership: ["baalut", "sug_baalut", "baalut_desc", "sug_baalut_desc"],
    owners: ["mispar_baalim", "baalim", "mispar_yadayim"],
    disabled: ["tav_nakhe", "tag_nakhe", "tag_nakhe_ind", "nakhe"],
    kmSinceTest: ["km_test_aharon", "kilometer_test_aharon", "ktm_test_aharon"]
};

function findKm(record) {
    const direct = pick(record, KEYS.kmSinceTest);
    if (direct !== null) return toNumber(direct);
    const k = Object.keys(record).find(x => /(km|kilom|ktm)/i.test(x) && /(test|tsht|tesht)/i.test(x));
    return k ? toNumber(record[k]) : null;
}

function findDisabled(record) {
    const v = pick(record, KEYS.disabled);
    if (v === null) return null;
    return /^(כן|yes|true|1|נכה)$/i.test(v);
}

// true = בתוקף, false = פג תוקף, null = אין תאריך
function testStatus(expiry) {
    if (!expiry) return null;
    const d = new Date(expiry);
    if (isNaN(d)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
}

async function fetchCarRecord(plate) {
    const records = await searchDatastore(CAR_REGISTRY_ID, { mispar_rechev: Number(plate) }, 1);
    return records[0] || null;
}

// רשומת הדגם (כ"ס, רמת גימור, נפח)
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

        const row = await findModelRow(car);

        const manufacturer = car.tozeret_nm || "לא ידוע";
        const model = car.kinuy_mishari || car.degem_nm || row?.kinuy_mishari || "לא ידוע";
        const trim = toText(row?.ramat_gimur) || toText(car.ramat_gimur) || null;
        const year = car.shnat_yitzur || "לא ידוע";
        const hp = toNumber(row?.koah_sus) ?? toNumber(car.koah_sus);
        const engineCc = toNumber(row?.nefah_manoa) ?? toNumber(car.nefah_manoa);
        const testExpiry = car.tokef_dt || null;

        console.log(`--------------------------------------------------`);
        console.log(`[SEARCH LOG] 🔍 מישהו חיפש רכב!`);
        console.log(`📅 זמן: ${timestamp}`);
        console.log(`🚗 מספר רכב: ${plate}`);
        console.log(`🏭 יצרן ודגם: ${manufacturer} ${model} ${trim || ""} (${year})`);
        console.log(`⚡ כוח סוס: ${hp != null ? hp : "לא ידוע"}`);
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
                engineCc,
                horsepower: hp,
                testExpiry,
                testValid: testStatus(testExpiry),
                ownership: pick(car, KEYS.ownership),
                owners: toNumber(pick(car, KEYS.owners)),
                disabled: findDisabled(car),
                kmSinceTest: findKm(car)
            }
        });
    } catch (error) {
        console.error(`[SEARCH LOG] 💥 שגיאה בחיפוש מספר ${plate}:`, error);
        res.status(500).json({ success: false, error: "שגיאה בשליפה" });
    }
});

// היסטוריית בעלות לרכב
app.get('/api/history/:plate', async (req, res) => {
    const plate = req.params.plate.replace(/\D/g, "");
    if (!HISTORY_ID) {
        return res.json({ success: false, message: "היסטוריית הבעלות לא הוגדרה בשרת" });
    }
    try {
        const records = await searchDatastore(HISTORY_ID, { mispar_rechev: Number(plate) }, 100);
        const clean = records.map(r => {
            const o = {};
            for (const [k, v] of Object.entries(r)) {
                if (k === "_id") continue;
                const t = toText(v);
                if (t !== null) o[k] = t;
            }
            return o;
        });
        res.json({ success: true, records: clean });
    } catch (e) {
        res.status(500).json({ success: false, message: "שגיאה בשליפת ההיסטוריה" });
    }
});

app.get('/api/debug/:plate', async (req, res) => {
    try {
        const car = await fetchCarRecord(req.params.plate);
        if (!car) return res.json({ success: false, message: "לא נמצא" });
        const row = await findModelRow(car);
        res.json({ success: true, car_fields: Object.keys(car), car, model_row: row });
    } catch (error) {
        console.error("שגיאה:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`השרת רץ בפורט ${PORT}`);
});