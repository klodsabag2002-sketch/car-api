const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// מילון הדגמים האישי שלנו - שומר גם על כוח סוס וגם על הגימור
const customSpecs = {
    "KL1CIZ": { hp: 300, modelName: "CUPRA LEON VZ", gimur: "VZ" }
};

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
            const degemCd = String(car.degem_cd).trim();
            
            let hpValue = "";
            let displayModel = car.toar_degem || car.כינוי_מסחרי || car.degem_nm || degemCd;
            let gimur = car.ramat_gimur || "";

            // 1. קודם בודקים במילון האישי שלנו
            if (customSpecs[degemCd]) {
                hpValue = `${customSpecs[degemCd].hp} כ"ס`;
                displayModel = customSpecs[degemCd].modelName;
                if (customSpecs[degemCd].gimur) gimur = customSpecs[degemCd].gimur;
            } 
            // 2. אם לא במילון, מחפשים כ"ס במאגר משרד התחבורה
            else if (tozeretCd && degemCd) {
                try {
                    const specsResource = "142aee44-ac7c-4db4-b426-8eaf28f13fb0";
                    const specsUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=${specsResource}&q=${degemCd}`;
                    
                    const specsResponse = await fetch(specsUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                    });
                    
                    if (specsResponse.ok) {
                        const specsData = await specsResponse.json();
                        if (specsData.success && specsData.result.records.length > 0) {
                            const exactModel = specsData.result.records.find(r => 
                                String(r.tozeret_cd) === String(tozeretCd)
                            ) || specsData.result.records[0];
                            
                            if (exactModel.hespek_manoa) {
                                hpValue = `${Math.round(exactModel.hespek_manoa * 1.341)} כ"ס`;
                            } else if (exactModel.koach_sus || exactModel.hp) {
                                hpValue = `${exactModel.koach_sus || exactModel.hp} כ"ס`;
                            }
                        }
                    }
                } catch (specErr) {
                    console.error("שגיאה בסריקת מפרט:", specErr);
                }
            }

            // 3. מסדרים את התצוגה ככה שהכל יופיע בצורה יפה: שורה של כוח סוס ושורה של גימור מתחת
            let finalOutput = "";
            if (hpValue && gimur) {
                // ה- \n מוריד את הגימור שורה אחת למטה
                finalOutput = `${hpValue}\nגימור: ${gimur}`;
            } else if (hpValue) {
                finalOutput = hpValue;
            } else if (gimur) {
                finalOutput = `גימור: ${gimur}\n(הספק חסר במאגר)`;
            } else {
                finalOutput = car.degem_manoa ? `מנוע: ${car.degem_manoa}` : "לא זמין";
            }

            res.json({
                success: true,
                data: {
                    manufacturer: car.shem_yatzran || car.tozeret_nm || "לא ידוע",
                    model: displayModel,
                    year: car.shnat_yitzur || "לא ידוע",
                    color: car.zeva_rechev || car.rechev_col || car.tzeva_rechev || "לא ידוע",
                    horsepower: finalOutput, // שולח את התצוגה המשולבת לאפליקציה
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
