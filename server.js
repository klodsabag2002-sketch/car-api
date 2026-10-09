const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// מערך הגיבוי: כל הכתובות המוכרות למאגרי המפרט הטכני של משרד התחבורה
const SPECS_RESOURCES = [
    "0d203d95-bc29-45dcc-85d4-fd9ce52dbd84",
    "5e87a7a1-2f6f-4cb8-897d-1cb30f9d7ab3",
    "0742f1aa-c69e-4735-8ee7-e699f7d242c7",
    "14283188-4357-463d-a7a2-ee851b22e177"
];

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate;
    const activeVehiclesResource = "053cea08-09bc-40ec-8f7a-156f0677aff3";
    const govUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${activeVehiclesResource}&q=${plate}`;

    try {
        const response = await fetch(govUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const data = await response.json();

        if (data && data.success && data.result && data.result.records.length > 0) {
            const car = data.result.records.find(r => r.mispar_rechev == plate) || data.result.records[0];
            
            const tozeretCd = car.tozeret_cd;
            const degemCd = car.degem_cd;
            const year = car.shnat_yitzur;

            let horsepowerText = "לא זמין במאגרי הממשלה";

            if (tozeretCd && degemCd) {
                // לולאה שעוברת על כל הכתובות האפשריות עד שהיא מוצאת מאגר תקין
                for (const resId of SPECS_RESOURCES) {
                    try {
                        const specsUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${resId}&q=${degemCd}`;
                        const specsResponse = await fetch(specsUrl, {
                            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                        });
                        
                        if (specsResponse.ok) {
                            const specsData = await specsResponse.json();
                            
                            if (specsData.success && specsData.result.records.length > 0) {
                                // סינון לזיהוי המודל והשנתון המדויקים
                                const exactModel = specsData.result.records.find(r => 
                                    r.shnat_yitzur == year && r.tozeret_cd == tozeretCd
                                ) || specsData.result.records[0];
                                
                                const hp = exactModel.koach_sus || exactModel.hp || exactModel.הספק_מנוע;
                                
                                if (hp) {
                                    horsepowerText = `${hp} כ"ס`;
                                    break; // מצאנו! עוצרים את הסריקה
                                } else if (exactModel.kw) {
                                    horsepowerText = `${Math.round(exactModel.kw * 1.341)} כ"ס`;
                                    break;
                                }
                            }
                        }
                    } catch (err) {
                        // אם המאגר הספציפי שבור (404), מדלגים לכתובת הבאה
                        continue;
                    }
                }
            }

            res.json({
                success: true,
                data: {
                    manufacturer: car.shem_yatzran || car.tozeret_nm || "לא ידוע",
                    model: car.toar_degem || car.כינוי_מסחרי || car.degem_nm || "לא ידוע",
                    year: year || "לא ידוע",
                    color: car.zeva_rechev || car.rechev_col || car.tzeva_rechev || "לא ידוע",
                    horsepower: horsepowerText,
                    testExpiry: car.tokef_dt || null
                }
            });
        } else {
            res.json({ success: false, message: "המספר אינו קיים במאגר משרד התחבורה" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "שגיאה כללית בשליפה" });
    }
});

app.listen(PORT, () => {
    console.log(`השרת רץ בפורט ${PORT}`);
});
