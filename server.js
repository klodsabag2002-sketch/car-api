const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate;
    
    // מזהה המאגר הראשי (רכבים פעילים)
    const activeVehiclesResource = "053cea08-09bc-40ec-8f7a-156f0677aff3";
    const govUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${activeVehiclesResource}&q=${plate}`;

    try {
        const response = await fetch(govUrl);
        const data = await response.json();

        if (data && data.success && data.result && data.result.records && data.result.records.length > 0) {
            // חיפוש הרכב הספציפי לפי מספר הרישוי
            const car = data.result.records.find(r => r.mispar_rechev == plate) || data.result.records[0];
            
            const tozeretCd = car.tozeret_cd; // קוד יצרן
            const degemCd = car.degem_cd;     // קוד דגם
            const year = car.shnat_yitzur;    // שנת ייצור

            let horsepowerText = "לא זמין במאגר";
            let engineVolume = car.nefach_manoa ? `${car.nefach_manoa}` : "לא ידוע";

            // אם יש לנו קוד יצרן וקוד דגם, נחפש במאגר המפרטים הטכניים
            if (tozeretCd && degemCd) {
                try {
                    // מזהה מאגר "תוצרים ודגמים של כלי רכב" (מפרט טכני WLTP)
                    const specsResource = "14283188-4357-463d-a7a2-ee851b22e177";
                    
                    // שימוש ב-q (חיפוש טקסט חופשי) שהוא בטוח יותר ומונע שגיאות של הפילטרים
                    const queryStr = encodeURIComponent(degemCd);
                    const specsUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${specsResource}&q=${queryStr}`;
                    
                    const specsResponse = await fetch(specsUrl);
                    const specsData = await specsResponse.json();

                    if (specsData && specsData.success && specsData.result && specsData.result.records.length > 0) {
                        // נסנן את התוצאות כדי למצוא בדיוק את היצרן והשנתון של הרכב
                        const exactModel = specsData.result.records.find(r => 
                            r.tozeret_cd == tozeretCd && 
                            r.degem_cd == degemCd && 
                            (r.shnat_yitzur == year || Math.abs(r.shnat_yitzur - year) <= 1)
                        ) || specsData.result.records[0]; // אם לא נמצאה התאמה מושלמת לשנה, ניקח את התוצאה הראשונה של הדגם

                        // מציאת ההספק מתוך השדות האפשריים במאגר
                        const hp = exactModel.koach_sus || exactModel.hp || exactModel.הספק_מנוע;
                        
                        if (hp) {
                            horsepowerText = `${hp} כ"ס`;
                        } else if (exactModel.kw) {
                            // אם המאגר מחזיר קילוואט, נמיר לכוח סוס
                            horsepowerText = `${Math.round(exactModel.kw * 1.341)} כ"ס`;
                        }
                    }
                } catch (specErr) {
                    console.log("שגיאה בשליפת המפרט הטכני:", specErr.message);
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
                    engine_volume: engineVolume,
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
