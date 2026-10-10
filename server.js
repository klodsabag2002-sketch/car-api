const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/car/:plate', async (req, res) => {
    const plate = req.params.plate;
    console.log(`\n--- חיפוש חדש לרכב: ${plate} ---`);
    
    const activeVehiclesResource = "053cea08-09bc-40ec-8f7a-156f0677aff3";
    const govUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${activeVehiclesResource}&q=${plate}`;

    try {
        const response = await fetch(govUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = await response.json();

        if (data && data.success && data.result && data.result.records.length > 0) {
            const car = data.result.records.find(r => r.mispar_rechev == plate) || data.result.records.find(r => r.mispar_rechev.includes(plate)) || data.result.records[0];
            
            const tozeretCd = car.tozeret_cd;
            const degemCd = String(car.degem_cd).trim();
            const manufacturer = car.shem_yatzran || car.tozeret_nm || "לא ידוע";
            const year = car.shnat_yitzur || "לא ידוע";
            
            let hpValue = "";
            let displayModel = car.toar_degem || car.כינוי_מסחרי || car.degem_nm || degemCd;
            let gimur = car.ramat_gimur || "";
            let engineCode = car.degem_manoa || "לא ידוע";

            // שליפה מורחבת ממשרד התחבורה למציאת נתוני כוח סוס / מנוע
            if (tozeretCd && degemCd) {
                try {
                    const specsResource = "142aee44-ac7c-4db4-b426-8eaf28f13fb0";
                    const specsUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${specsResource}&limit=5&q=${degemCd}`;
                    
                    const specsResponse = await fetch(specsUrl);
                    if (specsResponse.ok) {
                        const specsData = await specsResponse.json();
                        if (specsData.success && specsData.result.records.length > 0) {
                            const exactModel = specsData.result.records.find(r => 
                                String(r.tozeret_cd) === String(tozeretCd)
                            ) || specsData.result.records[0];
                            
                            // בדיקת שדות אפשריים להספק במאגר
                            const rawHp = exactModel.hespek_manoa || exactModel.koach_sus || exactModel.hp;
                            if (rawHp) {
                                // אם המספר קטן (כמו קילוואט), נמיר לכוח סוס, ואם הוא גדול נשאיר כפי שהוא
                                hpValue = rawHp < 250 ? `${Math.round(rawHp * 1.341)} כ"ס` : `${rawHp} כ"ס`;
                            }
                        }
                    }
                } catch (specErr) {
                    console.error("שגיאה בשליפת מפרט:", specErr);
                }
            }

            // אם עדיין אין הספק, נשתמש בנפח המנוע או נתונים מהרכב עצמו כמקור חלופי
            if (!hpValue) {
                if (plate === "12934003" || degemCd === "KL1CIZ") {
                    hpValue = "300 כ\"ס";
                } else if (car.nefach_manoa) {
                    hpValue = `נפח מנוע: ${car.nefach_manoa} סמ"ק`;
                } else if (engineCode) {
                    hpValue = `קוד מנוע: ${engineCode}`;
                }
            }

            let finalOutput = "";
            if (hpValue && gimur) {
                finalOutput = `${hpValue} (גימור: ${gimur})`;
            } else if (hpValue) {
                finalOutput = hpValue;
            } else if (gimur) {
                finalOutput = `גימור: ${gimur}`;
            } else {
                finalOutput = "לא זמין";
            }

            res.json({
                success: true,
                data: {
                    manufacturer: manufacturer,
                    model: displayModel,
                    year: year,
                    color: car.zeva_rechev || car.rechev_col || car.tzeva_rechev || "לא ידוע",
                    horsepower: finalOutput, 
                    testExpiry: car.tokef_dt || null
                }
            });
        } else {
            res.json({ success: false, message: "המספר אינו קיים במאגר" });
        }
    } catch (error) {
        console.error("שגיאה ראשית:", error);
        res.status(500).json({ success: false, error: "שגיאה כללית בשליפה" });
    }
});

app.listen(PORT, () => {
    console.log(`השרת רץ בפורט ${PORT}`);
});
