const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const RESOURCE_ID = "053cea08-09bc-40ec-8f7a-156f0677aff3";

// לוג לכל בקשה נכנסת
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// מחפש את שדה כוח הסוס גם אם שמו שונה מעט במאגר
function findHorsepower(car) {
    if (car.koah_sus != null && car.koah_sus !== "") return car.koah_sus;

    const key = Object.keys(car).find(k => /koa?h.*sus|koach|sus/i.test(k));
    return key ? car[key] : null;
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
    try {
        const car = await fetchCarRecord(req.params.plate);

        if (!car) {
            return res.json({ success: false, message: "המספר אינו קיים במאגר משרד התחבורה" });
        }

        const hp = findHorsepower(car);

        res.json({
            success: true,
            data: {
                manufacturer: car.shem_yatzran || car.tozeret_nm || car.miktza || "לא ידוע",
                model: car.toar_degem || car.כינוי_מסחרי || car.degem_nm || car.degem_des || "לא ידוע",
                year: car.shnat_yitzur || "לא ידוע",
                color: car.zeva_rechev || car.rechev_col || car.tzeva_rechev || "לא ידוע",
                testExpiry: car.tokef_dt || null,
                horsepower: hp != null ? (Number(hp) || hp) : null
            }
        });
    } catch (error) {
        console.error("שגיאה:", error);
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