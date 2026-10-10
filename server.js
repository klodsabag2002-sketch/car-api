const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const RESOURCE_ID = "053cea08-09bc-40ec-8f7a-156f0677aff3";

// לוג כללי לכל בקשה נכנסת לשרת
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// מחפש את שדה כוח הסוס. אם לא נמצא, מדפיס ללוג את כל שמות השדות שחזרו
function findHorsepower(car) {
    if (car.koah_sus != null && car.koah_sus !== "") return car.koah_sus;

    const key = Object.keys(car).find(k => /koa?h.*sus|koach|sus/i.test(k));
    if (key) return car[key];

    console.log("שדות שחזרו מהמאגר:", Object.keys(car).join(", "));
    return null;
}

async function fetchCarRecord(plate) {
    const filters = encodeURIComponent(JSON.stringify({ mispar_rechev: Number(plate) }));
    const govUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${RESOURCE_ID}&filters=${filters}`;

    const response = await fetch(govUrl);
    const data = await response.json();

    if (data?.success && data.result?.records?.length > 0) {
        return data.result.records[0];
    }
    return null;
}

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate;
    const timestamp = new Date().toISOString();

    try {
        const car = await fetchCarRecord(plate);

        if (!car) {
            console.warn(`[SEARCH LOG] ❌ 🚗 חיפוש רכב (לא נמצא במאגר): מספר ${plate} | שעה: ${timestamp}`);
            return res.json({ success: false, message: "המספר אינו קיים במאגר משרד התחבורה" });
        }

        const hp = findHorsepower(car);
        const manufacturer = car.shem_yatzran || car.tozeret_nm || car.miktza || "לא ידוע";
        const model = car.toar_degem || car.כינוי_מסחרי || car.degem_nm || car.degem_des || "לא ידוע";
        const year = car.shnat_yitzur || "לא ידוע";

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
                horsepower: hp != null ? (Number(hp) || hp) : null
            }
        });
    } catch (error) {
        console.error(`[SEARCH LOG] 💥 שגיאה בחיפוש מספר ${plate}:`, error);
        res.status(500).json({ success: false, error: "שגיאה בשליפה" });
    }
});

// נתיב בדיקה: מחזיר את כל השדות שמשרד התחבורה שולח לרכב
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