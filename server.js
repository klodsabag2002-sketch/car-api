const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const CAR_REGISTRY_ID = "053cea08-09bc-40ec-8f7a-156f0677aff3"; // מאגר רישוי רכבים
const MODELS_ID = "142afde2-6228-49f9-8a29-9b6c3a0cbe40";       // תוצרים ודגמים (כולל koah_sus)

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

// ממיר ערך לכוח סוס מספרי. DNF, ריק או לא מספר נחשבים "אין נתון"
function toHorsepower(value) {
    if (value == null) return null;
    const s = String(value).trim();
    if (s === "" || /^dnf$/i.test(s)) return null;
    const n = Number(s);
    return Number.isNaN(n) ? null : n;
}

async function fetchCarRecord(plate) {
    const records = await searchDatastore(CAR_REGISTRY_ID, { mispar_rechev: Number(plate) }, 1);
    return records[0] || null;
}

// ---------- כוח סוס ----------

async function findHorsepower(car) {
    const year = car.shnat_yitzur != null ? Number(car.shnat_yitzur) : null;

    // ניסיון 1: לפי קודים (הכי מדויק), אם קיימים ברשומת הרישוי
    const attempts = [];
    if (car.tozeret_cd != null && car.degem_cd != null && year) {
        attempts.push({
            tozeret_cd: Number(car.tozeret_cd),
            degem_cd: Number(car.degem_cd),
            shnat_yitzur: year
        });
    }
    // ניסיון 2: לפי שם דגם ושנה
    if (car.degem_nm && year) {
        attempts.push({
            degem_nm: String(car.degem_nm),
            shnat_yitzur: year
        });
    }

    for (const filters of attempts) {
        const rows = await searchDatastore(MODELS_ID, filters, 100);
        const hit = rows.map(r => toHorsepower(r.koah_sus)).find(hp => hp != null);
        if (hit != null) {
            console.log(`כוח סוס נמצא במאגר הדגמים: ${hit} | פילטר: ${JSON.stringify(filters)}`);
            return hit;
        }
    }

    // ניסיון 3: הערך שכבר נמצא ברשומת הרישוי עצמה (אם הוא מספרי)
    const fromRegistry = toHorsepower(car.koah_sus);
    if (fromRegistry != null) {
        console.log(`כוח סוס נמצא ברשומת הרישוי: ${fromRegistry}`);
        return fromRegistry;
    }

    console.log(`לא נמצא כוח סוס עבור: ${car.tozeret_nm} ${car.degem_nm} ${car.shnat_yitzur}`);
    return null;
}

// ---------- API ----------

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate;
    const timestamp = new Date().toISOString();

    try {
        const car = await fetchCarRecord(plate);

        if (!car) {
            console.warn(`[SEARCH LOG] ❌ 🚗 חיפוש רכב (לא נמצא במאגר): מספר ${plate} | שעה: ${timestamp}`);
            return res.json({ success: false, message: "המספר אינו קיים במאגר משרד התחבורה" });
        }

        const manufacturer = car.tozeret_nm || car.shem_yatzran || car.miktza || "לא ידוע";
        const model = car.kinuy_mishari || car.degem_nm || car.toar_degem || "לא ידוע";
        const year = car.shnat_yitzur || "לא ידוע";
        const hp = await findHorsepower(car);

        console.log(`--------------------------------------------------`);
        console.log(`[SEARCH LOG] 🔍 מישהו חיפש רכב!`);
        console.log(`📅 זמן: ${timestamp}`);
        console.log(`🚗 מספר רכב: ${plate}`);
        console.log(`🏭 יצרן ודגם: ${manufacturer} ${model} (${year})`);
        console.log(`⚡ כוח סוס: ${hp != null ? hp : "לא ידוע"}`);
        console.log(`⚠️ הערה: יש לוודא מול מאגר ה-Recall של משרד התחבורה האם קיימת קריאת שירות פתוחה לדגם זה.`);
        console.log(`--------------------------------------------------`);

        res.json({
            success: true,
            data: {
                manufacturer,
                model,
                year,
                color: car.zeva_rechev || car.rechev_col || car.tzeva_rechev || "לא ידוע",
                testExpiry: car.tokef_dt || null,
                horsepower: hp
            }
        });
    } catch (error) {
        console.error(`[SEARCH LOG] 💥 שגיאה בחיפוש מספר ${plate}:`, error);
        res.status(500).json({ success: false, error: "שגיאה בשליפה" });
    }
});

// נתיב בדיקה: מחזיר את השדות של רשומת הרישוי, כדי לוודא את שמות השדות
app.get('/api/debug/:plate', async (req, res) => {
    try {
        const car = await fetchCarRecord(req.params.plate);
        if (!car) return res.json({ success: false, message: "לא נמצא" });
        res.json({ success: true, fields: Object.keys(car), record: car });
    } catch (error) {
        console.error("שגיאה:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`השרת רץ בפורט ${PORT}`);
});