const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate;
    const activeVehiclesResource = "053cea08-09bc-40ec-8f7a-156f0677aff3";
    const govUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${activeVehiclesResource}&q=${plate}`;

    try {
        const response = await fetch(govUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const data = await response.json();

        if (data && data.success && data.result && data.result.records.length > 0) {
            const car = data.result.records.find(r => r.mispar_rechev == plate) || data.result.records[0];
            
            const tozeretCd = car.tozeret_cd;
            const degemCd = car.degem_cd;
            const year = car.shnat_yitzur;

            let horsepowerText = "לא זמין";

            if (tozeretCd && degemCd) {
                try {
                    const specsResource = "14283188-4357-463d-a7a2-ee851b22e177";
                    
                    // התיקון הקריטי: קידוד ה-URL כדי למנוע שגיאות רשת וקריסות של שרת ה-API
                    const safeQuery = encodeURIComponent(String(degemCd).trim());
                    const specsUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${specsResource}&q=${safeQuery}`;
                    
                    const specsResponse = await fetch(specsUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                    });
                    
                    const specsData = await specsResponse.json();

                    if (specsData.success && specsData.result.records.length > 0) {
                        // חיפוש מדויק כדי למנוע טעויות בין שנתונים שונים של אותו דגם
                        const exactModel = specsData.result.records.find(r => 
                            String(r.tozeret_cd) === String(tozeretCd) && 
                            String(r.degem_cd) === String(degemCd) &&
                            r.shnat_yitzur == year
                        ) || specsData.result.records.find(r => 
                            String(r.tozeret_cd) === String(tozeretCd) && 
                            String(r.degem_cd) === String(degemCd)
                        ) || specsData.result.records[0];
                        
                        const hp = exactModel.koach_sus || exactModel.hp || exactModel.הספק_מנוע;
                        
                        if (hp) {
                            horsepowerText = `${hp} כ"ס`;
                        } else if (exactModel.kw) {
                            horsepowerText = `${Math.round(exactModel.kw * 1.341)} כ"ס`;
                        } else {
                            horsepowerText = "נתון הספק חסר במאגר הממשלתי";
                        }
                    } else {
                        horsepowerText = "דגם זה לא נמצא במאגר המפרטים";
                    }
                } catch (specErr) {
                    horsepowerText = "תקלת קידוד/רשת בשליפת הדגם";
                }
            } else {
                horsepowerText = "חסר קוד דגם בסיסי";
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
