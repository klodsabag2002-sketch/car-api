const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate;
    
    // מזהה מאגר רכב פעיל מעודכן לפי התיעוד
    const activeVehiclesResource = "c8b9f9c8-4612-4068-934f-d4acc2e5c76e";
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
            
            let horsepowerText = "לא זמין";

            if (tozeretCd && degemCd) {
                try {
                    // מזהה מאגר תוצרים ודגמים מעודכן לפי התיעוד
                    const specsResource = "142aee44-ac7c-4db4-b426-8eaf28f13fb0";
                    
                    // חיפוש חכם במאגר הדגמים
                    const specsUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${specsResource}&q=${degemCd}`;
                    const specsResponse = await fetch(specsUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                    });
                    
                    if (specsResponse.ok) {
                        const specsData = await specsResponse.json();
                        
                        if (specsData.success && specsData.result.records.length > 0) {
                            // סינון כדי למצוא בדיוק את היצרן והדגם המבוקשים
                            const exactModel = specsData.result.records.find(r => 
                                String(r.tozeret_cd) === String(tozeretCd)
                            ) || specsData.result.records[0];
                            
                            // שליפת השדה המדויק hespek_manoa והכפלתו ב-1.341
                            if (exactModel.hespek_manoa) {
                                const hp = Math.round(exactModel.hespek_manoa * 1.341);
                                horsepowerText = `${hp} כ"ס`;
                            } else if (exactModel.koach_sus || exactModel.hp) {
                                horsepowerText = `${exactModel.koach_sus || exactModel.hp} כ"ס`;
                            }
                        }
                    }
                } catch (specErr) {
                    console.error("שגיאה בסריקת מפרט:", specErr);
                }
            }

            // גיבוי אם הנתון עדיין חסר
            if (horsepowerText === "לא זמין") {
                horsepowerText = car.ramat_gimur ? `גימור: ${car.ramat_gimur}` : (car.degem_manoa ? `מנוע: ${car.degem_manoa}` : "לא רשום במאגר");
            }

            res.json({
                success: true,
                data: {
                    manufacturer: car.shem_yatzran || car.tozeret_nm || "לא ידוע",
                    model: car.toar_degem || car.כינוי_מסחרי || car.degem_nm || "לא ידוע",
                    year: car.shnat_yitzur || "לא ידוע",
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
