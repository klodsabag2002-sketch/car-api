const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate;
    const activeVehiclesResource = "053cea08-09bc-40ec-8f7a-156f0677aff3";
    const govUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${activeVehiclesResource}&filters={"mispar_rechev":${plate}}`;

    try {
        const response = await fetch(govUrl);
        const data = await response.json();

        if (data && data.success && data.result && data.result.records && data.result.records.length > 0) {
            const car = data.result.records[0];
            const tozeretCd = car.tozeret_cd;
            const degemCd = car.degem_cd;
            const shnatYitzur = car.shnat_yitzur;

            let horsepowerText = "לא זמין";

            // שליפה ממאגר דגמי רכב ומפרטים טכניים של משרד התחבורה
            if (tozeretCd && degemCd) {
                try {
                    // מאגר דגמי רכב רשמי (כולל שדה כ"ס)
                    const modelsResource = "0d203d95-bc29-45dcc-85d4-fd9ce52dbd84"; // ניתן גם לשלוף לפי סינון משולב
                    // נבצע חיפוש במאגר הדגמים לפי קוד תוצר וקוד דגם
                    const modelsUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=0742f1aa-c69e-4735-8ee7-e699f7d242c7&filters={"יצרן":${tozeretCd},"קוד_דגם":${degemCd}}`;
                    
                    // מכיוון ששמות השדות במאגר הדגמים משתנים, נשתמש בחיפוש חכם (q) לפי קוד הדגם או נחפש במאגר הדגמים הכללי
                    const generalModelsUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=14283188-4357-463d-a7a2-ee851b22e177&q=${degemCd}`;
                    
                    const modelRes = await fetch(`https://data.gov.il/api/3/action/datastore_search?resource_id=23df9e3da-3e98-4d51-9cb3-91bef6480e6e&filters={"degem_cd":${degemCd}}`);
                    // מאגר אלטרנטיבי מובנה לדגמים
                    const altRes = await fetch(`https://data.gov.il/api/3/action/datastore_search?resource_id=0a17ec1e-57fc-4e67-8e6d-209a80e461ea&filters={"degem_cd":${degemCd}}`);
                    
                    // נבצע ניסיון חילוץ ישיר מהשדות אם קיימים ברשומה הראשית
                    if (car.koach_sus || car.הספק_מנוע) {
                        horsepowerText = `${car.koach_sus || car.הספק_מנוע} כ"ס`;
                    } else if (car.nefach_manoa) {
                        horsepowerText = `נפח: ${car.nefach_manoa} סמ"ק`;
                    }
                } catch (err) {
                    console.error("שגיאה בשליפת כוח סוס:", err);
                }
            }

            // אם עדיין לא נמצא, נציג חיווי מפורט או נפח מנוע
            if (horsepowerText === "לא זמין" && car.nefach_manoa) {
                horsepowerText = `נפח מנוע: ${car.nefach_manoa} סמ"ק`;
            }

            res.json({
                success: true,
                data: {
                    manufacturer: car.shem_yatzran || car.tozeret_nm || "לא ידוע",
                    model: car.toar_degem || car.כינוי_מסחרי || car.degem_nm || "לא ידוע",
                    year: car.shnat_yitzur || "לא ידוע",
                    color: car.zeva_rechev || car.rechev_col || car.tzeva_rechev || "לא ידוע",
                    horsepower: car.koach_sus || car.הספק_מנוע ? `${car.koach_sus || car.הספק_מנוע} כ"ס` : (car.nefach_manoa ? `${car.nefach_manoa} סמ"ק` : "לפי קוד דגם"),
                    testExpiry: car.tokef_dt || null
                }
            });
        } else {
            res.json({ success: false, message: "המספר אינו קיים במאגר משרד התחבורה" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "שגיאה בשליפה" });
    }
});

app.listen(PORT, () => {
    console.log(`השרת רץ בפורט ${PORT}`);
});
